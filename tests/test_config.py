from engine.config import load_config


def test_weights_sum_to_one():
    config = load_config()
    total = sum(config["weights"].values())
    assert abs(total - 1.0) < 1e-9


def test_verdict_thresholds_are_ordered():
    thresholds = load_config()["verdict_thresholds"]
    assert thresholds["risky"] < thresholds["viable"]