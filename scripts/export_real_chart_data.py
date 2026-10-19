#!/usr/bin/env python3
"""Export SMALL, de-identified, source-backed chart aggregates from local assets.

Never fits a model, publishes parcel IDs or guesses missing measurements.
The default destination is under gitignored outputs/, for inspection before
explicitly copying to site/data/real_charts.json.
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
MONTHS = tuple(range(4, 11))
MONTH_NAMES = ("Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct")
COMBINED = ROOT / "data/processed/agronomic_calendar_set/v1/monthly_inputs_apr_oct.parquet"
CLIMATE = ROOT / "data/processed/family_1/environment/climate_monthly_timeseries.parquet"
SATELLITE = ROOT / "data/processed/family_1/timeseries/sentinel_timeseries.parquet"
DEFAULT_OUTPUT = ROOT / "outputs/site_extract/real_charts.json"
ID = "ID_POLIGONO"


def source_name(path: Path) -> str:
    try:
        return path.resolve().relative_to(ROOT.resolve()).as_posix()
    except ValueError:
        return path.name  # Never expose absolute paths or user directories.


def read_columns(path: Path, columns: list[str]) -> pd.DataFrame:
    """Projection avoids loading hundreds of unrelated columns from Parquet."""
    if not path.is_file():
        raise FileNotFoundError(f"Missing {path}; pass its actual path with a CLI option")
    suffix = path.suffix.lower()
    if suffix in (".parquet", ".pq"):
        return pd.read_parquet(path, columns=columns)
    if suffix == ".csv":
        return pd.read_csv(path, usecols=columns)
    raise ValueError(f"Expected .parquet or .csv: {source_name(path)}")


def monthly_values(frame: pd.DataFrame, field: str, *, acquisition: bool) -> dict:
    required = [ID, "year", "month", field]
    if not set(required).issubset(frame):
        raise ValueError(f"Missing required columns for {field}: {set(required)-set(frame)}")
    x = frame.loc[frame.year.eq(2025) & frame.month.isin(MONTHS), required].copy()
    if x.empty:
        raise ValueError(f"No 2025 April–October rows for {field}")
    x[field] = pd.to_numeric(x[field], errors="coerce").replace([np.inf, -np.inf], np.nan)
    if (x[field].dropna() < 0).any() and field == "precip_mean":
        raise ValueError("Negative monthly rainfall in input")
    if field == "ndvi_promedio" and (x[field].dropna().abs() > 1).any():
        raise ValueError("NDVI outside [-1, 1]; verify original units")
    keys = [ID, "year", "month"]
    if not acquisition and x.duplicated(keys).any():
        raise ValueError(f"Duplicate parcel-months in {field}; expected monthly source")
    # Satellite archive contains acquisitions: median per parcel/month first.
    parcels = x.groupby(keys, sort=True)[field].median().reset_index()
    unique = set(parcels[ID].dropna().unique())
    if len(unique) != 197:
        raise ValueError(f"{field}: expected 197 distinct parcel IDs, found {len(unique)}")
    records = []
    for month, label in zip(MONTHS, MONTH_NAMES):
        v = parcels.loc[parcels.month.eq(month), field].dropna().to_numpy(dtype=float)
        if not len(v):
            raise ValueError(f"No observations for {field} in month {month}")
        q10, median, q90 = np.quantile(v, [0.1, 0.5, 0.9])
        records.append(dict(month=month, label=label, n=int(len(v)),
                            mean=float(np.mean(v)), median=float(median),
                            p10=float(q10), p90=float(q90)))
    return dict(variable="precipitation" if field == "precip_mean" else "ndvi",
                unit="mm/month" if field == "precip_mean" else "NDVI",
                year=2025, population="197 study parcels, available per-month observations",
                aggregation="One monthly value per parcel, then descriptive statistics across parcels. " +
                  ("Satellite acquisitions reduced to parcel-month median first." if acquisition else
                   "Monthly precipitation values kept in their recorded units."),
                months=records)


def read_loocv(path: Path, model: str) -> pd.DataFrame:
    if path.suffix.lower() in (".pq", ".parquet"):
        d = pd.read_parquet(path)
    elif path.suffix.lower() == ".csv":
        d = pd.read_csv(path)
    else:
        raise ValueError("LOOCV must be CSV or Parquet")
    if "experiment" in d.columns:
        d = d[d.experiment.astype(str).eq(model)].copy()
    aliases = {
        "true": ["y_true", "RENDIMIENTO_T_HA", "observed_t_ha", "observed"],
        "pred": ["y_pred", "prediction", "predicted_t_ha", f"{model}_t_ha"],
    }
    def pick(names: list[str]) -> str:
        for name in names:
            if name in d.columns:
                return name
        raise ValueError(f"Missing columns: one of {names}")
    actual = pick(aliases["true"])
    predicted = pick(aliases["pred"])
    if ID not in d:
        raise ValueError(f"LOOCV requires {ID} for uniqueness and paired audits")
    d = d[[ID, actual, predicted]].rename(
        columns={actual: "y_true", predicted: "y_pred"})
    if (len(d) != 138 or d[ID].isna().any() or d[ID].duplicated().any() or
            d[["y_true", "y_pred"]].isna().any().any()):
        raise ValueError(f"{model}: expected 138 distinct, complete held-out parcels; found {len(d)} rows")
    if not np.isfinite(d[["y_true", "y_pred"]].to_numpy(float)).all():
        raise ValueError(f"{model}: non-finite validation values")
    return d.sort_values(ID).reset_index(drop=True)


def model_summary(frame: pd.DataFrame, model: str) -> dict:
    truth = frame.y_true.to_numpy(float)
    pred = frame.y_pred.to_numpy(float)
    e = pred - truth
    rmse = float(np.sqrt(np.mean(e ** 2)))
    mae = float(np.mean(np.abs(e)))
    tss = float(np.sum((truth - np.mean(truth)) ** 2))
    r2 = float(1 - np.sum(e ** 2) / tss) if tss > 0 else None
    # Guard against accidentally supplying a different evaluation protocol.
    if model == "Reference26" and abs(rmse - 0.468186) > 0.0001:
        raise ValueError("Reference26 LOOCV RMSE does not match the documented 0.468186 t/ha; "
                         f"got {rmse:.6f}. Check model, folds and prediction column.")
    step = .25
    minimum = step * math.floor(float(e.min()) / step)
    maximum = step * (math.floor(float(e.max()) / step) + 1)
    edges = np.linspace(minimum, maximum, int(round((maximum-minimum)/step))+1)
    hist, _ = np.histogram(e, bins=edges)
    bins = [dict(lower=float(lo), upper=float(hi), n=int(n))
            for lo, hi, n in zip(edges[:-1], edges[1:], hist) if n]
    if sum(x["n"] for x in bins) != 138:
        raise AssertionError("Residual histogram must contain all 138 errors")
    return dict(model=model, n=138, train_labels_per_fit=137, validation="LOOCV",
                residual_sign="prediction-minus-observation",
                metrics=dict(rmse=rmse, mae=mae, bias=float(e.mean()),
                             median_absolute_error=float(np.median(abs(e))),
                             max_absolute_error=float(abs(e).max()), r2=r2),
                residual_histogram=bins)


def parse_model_file(argument: str) -> tuple[str, Path]:
    if "=" not in argument:
        raise argparse.ArgumentTypeError("Use --loocv Reference26=path/to/138_oof.csv")
    model, path = argument.split("=", 1)
    if model not in {"Reference26", "Compact14", "Local04D", "Blend"}:
        raise argparse.ArgumentTypeError("Allowed models: Reference26, Compact14, Local04D, Blend")
    return model, Path(path)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--monthly", type=Path, help="Ready 197-parcel monthly_inputs_apr_oct.parquet")
    p.add_argument("--climate", type=Path, help="Climate file with precip_mean, year, month and parcel ID")
    p.add_argument("--satellite", type=Path, help="Sentinel acquisitions with ndvi_promedio")
    p.add_argument("--loocv", action="append", type=parse_model_file, default=[],
                   metavar="MODEL=FILE", help="Repeat for each independently confirmed 138-fold LOOCV")
    p.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = p.parse_args()
    if args.monthly and (args.climate or args.satellite):
        p.error("Use --monthly OR --climate and --satellite, not both")
    if args.monthly or (not args.climate and not args.satellite and COMBINED.exists()):
        path = args.monthly or COMBINED
        cols = [ID, "year", "month", "precip_mean", "ndvi_promedio"]
        d = read_columns(path, cols)
        rain = monthly_values(d, "precip_mean", acquisition=False)
        ndvi = monthly_values(d, "ndvi_promedio", acquisition=False)
        files = [path]
    else:
        cp, sp = args.climate or CLIMATE, args.satellite or SATELLITE
        rain = monthly_values(read_columns(cp, [ID, "year", "month", "precip_mean"]),
                              "precip_mean", acquisition=False)
        ndvi = monthly_values(read_columns(sp, [ID, "year", "month", "ndvi_promedio"]),
                              "ndvi_promedio", acquisition=True)
        files = [cp, sp]
    if len({name for name, _ in args.loocv}) != len(args.loocv):
        raise ValueError("Duplicate model in --loocv")
    models, reference = [], None
    for name, path in args.loocv:
        rows = read_loocv(path, name)
        if reference is None:
            reference = rows[[ID, "y_true"]]
        elif not rows[[ID, "y_true"]].equals(reference):
            raise ValueError(f"{name}: held-out parcel IDs or true yields differ across models")
        models.append(model_summary(rows, name))
        files.append(path)
    package = dict(schema_version=1, kind="real_chart_aggregates",
                   scope="2025 retrospective field data; unknown yields never used",
                   privacy="Only cross-parcel monthly statistics and binned OOF residuals; no IDs or coordinates",
                   rainfall=rain, ndvi=ndvi, loocv_models=models,
                   sources=[dict(file=source_name(path), size_bytes=path.stat().st_size) for path in files])
    output = args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(package, ensure_ascii=False, allow_nan=False,
                                 indent=2)+"\n", encoding="utf-8")
    print(f"SUCCESS: {output} ({output.stat().st_size:,} bytes)")
    print(f"Monthly coverage: rainfall {[x['n'] for x in rain['months']]}; "
          f"NDVI {[x['n'] for x in ndvi['months']]}")
    print(f"LOOCV models: {[x['model'] for x in models] or 'none provided'}")
    print("Share ONLY this compact JSON for chart implementation, not the original Parquet files.")


if __name__ == "__main__":
    main()
