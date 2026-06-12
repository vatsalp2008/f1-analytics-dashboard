"""CLI: backtest the prediction pipeline against actual 2025 race results.

Usage:
    python scripts/run_backtest.py [year] [--rounds 1,2,3] [--out path.json] [--verbose]

Defaults: year=2025, all completed rounds, writes JSON to backtest_results/{year}.json.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from utils.backtest import backtest_year


def parse_rounds(s: str) -> list[int]:
    return [int(x) for x in s.split(",") if x.strip()]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("year", type=int, nargs="?", default=2025)
    parser.add_argument("--rounds", type=parse_rounds, default=None,
                        help="Comma-separated round numbers (default: all completed)")
    parser.add_argument("--out", type=Path, default=None,
                        help="Where to write JSON (default: backtest_results/{year}.json)")
    parser.add_argument("--verbose", action="store_true",
                        help="Show full run_prediction output (noisy)")
    args = parser.parse_args()

    df = backtest_year(args.year, rounds=args.rounds, quiet=not args.verbose)
    if df.empty:
        print("\nNo races scored.")
        sys.exit(1)

    print("\n" + "=" * 78)
    print(f"BACKTEST RESULTS — {args.year}")
    print("=" * 78)
    print(df.to_string(index=False, float_format=lambda x: f"{x:.3f}"))

    print("\n" + "-" * 78)
    print("AGGREGATE")
    print("-" * 78)
    print(f"  Mean Spearman ρ           : {df['spearman_rho'].mean():+.3f}")
    print(f"  Mean top-3 hit rate       : {df['top3_hit_rate'].mean():.2f} / 3")
    print(f"  Mean weighted position err: {df['weighted_position_err'].mean():.2f}")
    print(f"  Mean MAE on position      : {df['mae_position'].mean():.2f}")
    print(f"  Races scored              : {len(df)}")

    out_path = args.out or Path(__file__).resolve().parents[1] / "backtest_results" / f"{args.year}.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "year": args.year,
        "races": df.to_dict(orient="records"),
        "aggregate": {
            "mean_spearman_rho": float(df["spearman_rho"].mean()),
            "mean_top3_hit_rate": float(df["top3_hit_rate"].mean()),
            "mean_weighted_position_err": float(df["weighted_position_err"].mean()),
            "mean_mae_position": float(df["mae_position"].mean()),
            "n_races": int(len(df)),
        },
        "notes": [
            "Weather override used: rain_probability=0, T=22°C, humidity=50%, wind=2m/s",
            "DNF→pos 19, DSQ→pos 20 (mirrors predictor.py extractor)",
            "Spearman ρ on full grid; top-3 hit rate counts overlap between predicted P1-3 and actual P1-3",
        ],
    }
    out_path.write_text(json.dumps(payload, indent=2))
    print(f"\n✅ Wrote {out_path}")


if __name__ == "__main__":
    main()
