import numpy as np
import scipy.ndimage
import mercantile

class GridProcessor:
    """
    Handles grid interpolation and elevation extraction logic.
    """

    @staticmethod
    def get_interpolated_grid(tile_data, size=256):
        """
        Returns a (size, size) numpy array of elevation data for the tile.
        Upscales the low-res 16x16 fetched data.
        """
        if not tile_data or 'elevation' not in tile_data:
            return np.zeros((size, size))

        raw_elev = np.array(tile_data['elevation'])
        if raw_elev.size != 16*16:
             return np.zeros((size, size))

        grid_16 = raw_elev.reshape((16, 16)).T
        grid_16 = np.flipud(grid_16)

        zoom_factor = size / 16.0
        high_res_grid = scipy.ndimage.zoom(grid_16, zoom_factor, order=1)

        return high_res_grid

    @staticmethod
    def extract_elevation_from_tile(tile_data, lat, lon, tile):
        """
        Performs bilinear interpolation on the 16x16 grid to find elevation at lat, lon.
        """
        if not tile_data or 'elevation' not in tile_data:
            return 0.0

        raw_elev = np.array(tile_data['elevation'])
        if raw_elev.size != 256:
             return 0.0

        grid = raw_elev.reshape((16, 16))

        bounds = mercantile.bounds(tile)
        lat_min, lat_max = bounds.south, bounds.north
        lon_min, lon_max = bounds.west, bounds.east

        if lat_max == lat_min or lon_max == lon_min:
            return 0.0

        u = (lat - lat_min) / (lat_max - lat_min) * 15.0
        v = (lon - lon_min) / (lon_max - lon_min) * 15.0

        u = np.clip(u, 0, 15)
        v = np.clip(v, 0, 15)

        i = int(np.floor(u))
        j = int(np.floor(v))

        u_ratio = u - i
        v_ratio = v - j

        i_next = min(i + 1, 15)
        j_next = min(j + 1, 15)

        p00 = grid[j, i]
        p10 = grid[j, i_next]
        p01 = grid[j_next, i]
        p11 = grid[j_next, i_next]

        val_j = (p00 * (1 - u_ratio)) + (p10 * u_ratio)
        val_jnext = (p01 * (1 - u_ratio)) + (p11 * u_ratio)

        final_elev = (val_j * (1 - v_ratio)) + (val_jnext * v_ratio)

        return float(final_elev)
