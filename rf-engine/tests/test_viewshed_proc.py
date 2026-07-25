
import pytest
from unittest.mock import MagicMock
import sys
import os
import numpy as np

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.viewshed_proc import process_batch_viewshed, _node_color

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

    def test_node_color_distinct_and_deterministic(self):
        colors = [_node_color(i, 4) for i in range(4)]
        assert len(set(colors)) == 4
        assert _node_color(0, 4) == _node_color(0, 4)
        for c in colors:
            assert c.startswith('#') and len(c) == 7

    def test_process_batch_viewshed_assigns_per_node_colors(self, mock_tile_manager):
        """P6-1: each node gets a distinct color, and the composite image
        actually contains per-node pixels (not a single flat overlay)."""
        nodes = [
            {"lat": 45.0, "lon": -122.0, "height": 10, "name": "A"},
            {"lat": 45.01, "lon": -122.0, "height": 10, "name": "B"},
        ]
        options = {"radius": 2000}

        def fake_viewshed(tm, lat, lon, h, r, rx_h, freq_mhz, resolution_m):
            grid = np.ones((20, 20), dtype=np.uint8)
            grid_lats = np.linspace(lat + 0.01, lat - 0.01, 20)
            grid_lons = np.linspace(lon - 0.01, lon + 0.01, 20)
            return grid, grid_lats, grid_lons

        with pytest.MonkeyPatch.context() as m:
            m.setattr("core.viewshed_proc.calculate_viewshed", fake_viewshed)
            result = process_batch_viewshed(nodes, options, mock_tile_manager)

        assert result["status"] == "completed"
        colors = [r["color"] for r in result["results"]]
        assert len(colors) == 2
        assert len(set(colors)) == 2  # distinct per node
        for c in colors:
            assert c.startswith('#') and len(c) == 7

        # Decode the composite and confirm it actually carries visible,
        # multi-colored pixels rather than being blank or single-color.
        import base64
        from io import BytesIO
        from PIL import Image

        img = Image.open(BytesIO(base64.b64decode(result["composite"]["image"])))
        arr = np.array(img)
        visible = arr[..., 3] > 0
        assert visible.sum() > 0
        unique_rgb = {tuple(px) for px in arr[visible][:, :3].tolist()}
        assert len(unique_rgb) >= 2
