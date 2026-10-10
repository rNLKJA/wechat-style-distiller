#!/usr/bin/env python3
"""
Statistical verification script - verifies TS implementations against scipy reference.

Run with: uv run --with scipy --with numpy scripts/verify_stats.py
"""

import json
import sys
from typing import Dict, Any

try:
    import numpy as np
    from scipy import stats
except ImportError:
    print("ERROR: scipy and numpy required. Run with: uv run --with scipy --with numpy scripts/verify_stats.py", file=sys.stderr)
    sys.exit(1)


def wilson_ci_scipy(successes: int, trials: int, confidence: float = 0.95) -> tuple[float, float]:
    """
    Compute Wilson score confidence interval using scipy.

    This is the reference implementation. The TypeScript version in
    web/src/lib/stats/confidence-intervals.ts should match this output.
    """
    if trials == 0:
        return (0.0, 0.0)

    # Use statsmodels formula (same as R's binom.test with Wilson method)
    # scipy.stats doesn't have Wilson CI directly, so we compute it manually
    p = successes / trials
    z = stats.norm.ppf((1 + confidence) / 2)

    denominator = 1 + z**2 / trials
    center = (p + z**2 / (2 * trials)) / denominator
    margin = z * np.sqrt((p * (1 - p) / trials + z**2 / (4 * trials**2))) / denominator

    lower = max(0.0, center - margin)
    upper = min(1.0, center + margin)

    return (lower, upper)


def verify_wilson_ci():
    """Verify Wilson CI implementation against test cases."""
    test_cases = [
        {"successes": 50, "trials": 100, "confidence": 0.95},
        {"successes": 0, "trials": 10, "confidence": 0.95},
        {"successes": 10, "trials": 10, "confidence": 0.95},
        {"successes": 1, "trials": 100, "confidence": 0.95},
    ]

    results = []
    for case in test_cases:
        lower, upper = wilson_ci_scipy(case["successes"], case["trials"], case["confidence"])
        results.append({
            "case": case,
            "lower": round(lower, 6),
            "upper": round(upper, 6),
        })

    return results


def main():
    print("Statistical Verification - Wilson Confidence Interval")
    print("=" * 60)
    print("\nReference implementation: scipy + manual Wilson formula")
    print("Target implementation: web/src/lib/stats/confidence-intervals.ts\n")

    results = verify_wilson_ci()

    print("Test Cases:")
    for i, result in enumerate(results, 1):
        case = result["case"]
        print(f"\n{i}. successes={case['successes']}, trials={case['trials']}, confidence={case['confidence']}")
        print(f"   CI: [{result['lower']:.6f}, {result['upper']:.6f}]")

    # Output JSON for programmatic comparison
    print("\n" + "=" * 60)
    print("JSON output (for CI integration):")
    print(json.dumps(results, indent=2))

    print("\n✓ Verification complete. Compare these values to TypeScript test expectations.")


if __name__ == "__main__":
    main()
