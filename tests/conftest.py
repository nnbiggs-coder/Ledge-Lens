from __future__ import annotations

import pytest

from tools.socotra_tool import reset_socotra_store


@pytest.fixture(autouse=True)
def _reset_socotra():
    reset_socotra_store()
    yield
    reset_socotra_store()
