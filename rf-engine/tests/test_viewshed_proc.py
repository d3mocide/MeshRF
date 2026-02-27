
import pytest
from unittest.mock import MagicMock
import sys
import os
import numpy as np

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.viewshed_proc import process_batch_viewshed

class TestViewshedProc:
    @pytest.fixture
    def mock_tile_manager(self):
        tm = MagicMock()
        tm.get_elevation.return_value = 100.0
        tm.get_elevation_profile.return_value = [100.0] * 15
        return tm

    def test_process_batch_viewshed_basic(self, mock_tile_manager):
        nodes = [{"lat": 45.0, "lon": -122.0, "height": 10, "name": "Test1"}]
        options = {"radius": 1000, "optimize_n": 1}

        # Mock rf_physics calls
        with pytest.MonkeyPatch.context() as m:
            m.setattr("core.algorithms.calculate_viewshed",
                lambda tm, lat, lon, h, r, rx_h, freq_mhz, resolution_m: (
                    np.zeros((10, 10)), np.zeros(10), np.zeros(10)
                )
            )

            result = process_batch_viewshed(nodes, options, mock_tile_manager)

            assert result["status"] == "completed"
            assert len(result["results"]) == 1
            assert "composite" in result

    def test_process_batch_viewshed_empty(self, mock_tile_manager):
        result = process_batch_viewshed([], {}, mock_tile_manager)
        assert result["status"] == "completed"
        assert len(result["results"]) == 0
