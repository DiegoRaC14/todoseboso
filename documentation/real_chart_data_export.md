# Real-data chart export (no large uploads)

# Published 2025 snapshot (October 19, 2026)

The user-supplied `monthly_inputs_apr_oct.parquet` was inspected and its
observed monthly aggregates are now published as `site/data/real_charts.json`
on `main`. The original Parquet contains 5,516 monthly rows (197 parcels,
7 months per year, 2022–2025), with all 197 April–October 2025 observations
complete for precipitation and NDVI. Historical NDVI has 39 missing values.
Original SHA-256:
`971bdac1808036e7ca9be3260faa7608e82e2530ef0285a0c0f432a6fae2d635`.

The public file holds only 2025 per-month summary statistics, not raw
parcel values. The genuine monthly charts load this published JSON.
LOOCV-specific statistics remain unavailable until the corresponding 138
out-of-fold predictions are supplied; do not substitute in-sample or
59-unknown prediction rows.


The public story website uses exact, versioned experimental summaries where
available. This extractor fills the remaining empirical charts using only
existing private observations; it **does not train**, interpolate, simulate,
impute missing monthly measurements, or expose parcel IDs.

## Required local data

Preferred input already produced by the agronomic-calendar pipeline:

- `data/processed/agronomic_calendar_set/v1/monthly_inputs_apr_oct.parquet`

It contains `ID_POLIGONO`, `year`, `month`, `precip_mean`
(monthly mm) and `ndvi_promedio` (monthly median of valid satellite acquisitions).
The exporter projects just these five columns, so it does not load unrelated
feature matrices or the original remote-sensing archives.

If the preferred file does not exist, use these two existing inputs:

- `data/processed/family_1/environment/climate_monthly_timeseries.parquet`
- `data/processed/family_1/timeseries/sentinel_timeseries.parquet`

The satellite file may contain multiple acquisitions. The script first takes
the median within each parcel-month, then summarizes across parcels. Missing
values are **excluded and counted**, never filled with an invented observation.
No guarantee of month-by-month complete satellite coverage is implied.

An **optional** dedicated 138-row LOOCV CSV/Parquet for each model has:
`ID_POLIGONO, y_true, y_pred`, with 138 unique held-out parcel IDs, and
exactly one held-out prediction for each. Model-specific predicted names
(`Reference26_t_ha`, etc.) and true names `RENDIMIENTO_T_HA` are also
accepted. If the file is a long table with an `experiment` column, records
are filtered to the requested model. Never pass in-sample final-fit outputs
or the 59 unknown-parcel predictions as if they were LOOCV.

Supported names: `Reference26`, `Compact14`, `Local04D`, `Blend`.
LOOCV evaluation is different from the earlier 65 folds and the separate
97/41 protocol; mixing them would invalidate error summaries.

## Run (PowerShell, repo root)

```powershell
git pull --ff-only
conda activate geocebada
python scripts/export_real_chart_data.py
```

If the preferred monthly input is missing, the program automatically tries
the two fallback files above. Paths can be overridden:

```powershell
python scripts/export_real_chart_data.py --monthly "D:\\datos\\monthly_inputs_apr_oct.parquet"
```

With a verified LOOCV file for Reference26:

```powershell
python scripts/export_real_chart_data.py --loocv "Reference26=outputs/research/loo_reference26.csv"
```

Multiple genuine, matched 138-fold files:

```powershell
python scripts/export_real_chart_data.py `
  --loocv "Reference26=outputs/research/loo_reference26.csv" `
  --loocv "Compact14=outputs/research/loo_compact14.csv"
```

The names above are **examples**, not assertions that those files exist.
Substitute the paths of your real LOOCV outputs.

The script writes:

```
outputs/site_extract/real_charts.json
```

This JSON is generally a few kilobytes: 7 months of rain, 7 months of NDVI,
the count of valid observations, mean, median and percentiles 10/90 for each
month, plus optional aggregate LOOCV metrics and binned residuals.
It contains no `ID_POLIGONO` entries, centroid coordinates, raw yield
records, or serialized model. The input paths in provenance are relative to
the repo or reduced to basenames, with file sizes for auditing.

**Share only `outputs/site_extract/real_charts.json` in the chat.**
Do not upload the Parquet archives, original geospatial data, or joblib models.

## Website contract

When source data are reviewed, the compact JSON can be added to
`site/data/real_charts.json`. The static page will automatically render the
monthly curves under **El clima y la vegetación observados en 2025** and any
LOOCV tables; no JavaScript changes or hosting backend are needed.

Until that file exists, the page **does not invent a replacement graph**.
The separate 210-mm demonstration remains explicitly an educational
simulation. The existing 59-parcel gallery remains predictions for unknown
yields, not observations.

Tests check the publication schema and that group sizes do not exceed the
197 parcels; the export script validates that there are 197 distinct source
IDs, observed month values are finite, monthly rain is nonnegative, NDVI
lies in [-1, 1], LOOCV rows are unique and complete, and 138-fold Reference26
RMSE is consistent with the team-reported value to 1e-4 t/ha.

Missing observations should be investigated, not silently manufactured.

## Interpretation

For month `m` with observed parcel values `x_{im}` over the available
set `S_m`, the plot shows

```text
n_m       = |S_m|
mean_m    = sum_{i in S_m} x_im / n_m
median_m  = empirical median
band_m    = [empirical percentile 10, empirical percentile 90]
```

Satellite acquisitions are reduced to a single parcel-month median first.
The percentile band represents across-parcel heterogeneity, **not**
a statistical confidence interval or a prediction interval.
This is retrospective 2025 exploration, not a claim that October conditions
were known at sowing time.

For LOOCV `e_i = yhat_i - y_i`, the RMSE, MAE, signed bias and maximum
absolute error are computed from exactly one out-of-fold prediction per
known parcel. That alone does not prove leakage-free training: the source
process must retain its own validation/audit record.
