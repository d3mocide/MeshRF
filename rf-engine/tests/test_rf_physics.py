import math
import sys
import os

import pytest

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import rf_physics


class TestHataLoss:
    """Okumura-Hata (ROADMAP P3-1 -- must stay in step with src/utils/math/hata.js)."""

    def test_urban_small_reference(self):
        # f=900MHz, hb=50m, hm=1.5m, d=5km. Hand-computed: 146.9428 dB
        loss = rf_physics.calculate_hata_loss(5000, 900, 50, 1.5, 'urban_small')
        assert loss == pytest.approx(146.9428, abs=1e-3)

    def test_suburban_is_reduction_from_urban(self):
        urban = rf_physics.calculate_hata_loss(5000, 900, 50, 1.5, 'urban_small')
        suburban = rf_physics.calculate_hata_loss(5000, 900, 50, 1.5, 'suburban')
        expected_delta = 2 * (math.log10(900 / 28) ** 2) + 5.4
        assert urban - suburban == pytest.approx(expected_delta, abs=1e-6)

    def test_environment_ordering(self):
        urban = rf_physics.calculate_hata_loss(5000, 900, 50, 1.5, 'urban_small')
        suburban = rf_physics.calculate_hata_loss(5000, 900, 50, 1.5, 'suburban')
        rural = rf_physics.calculate_hata_loss(5000, 900, 50, 1.5, 'rural')
        assert urban > suburban > rural

    def test_clamps_degenerate_input(self):
        loss = rf_physics.calculate_hata_loss(0, 915, 0, 0, 'suburban')
        assert math.isfinite(loss)
        assert loss >= 0.0


class TestCost231Loss:
    """COST 231-Hata extension (ROADMAP P4-2)."""

    def test_reference_1800mhz(self):
        # f=1800MHz, hb=50m, hm=1.5m, d=5km, C=0. Hand-computed: 156.7364 dB
        loss = rf_physics.calculate_cost231_loss(5000, 1800, 50, 1.5, 'urban_small')
        assert loss == pytest.approx(156.7364, abs=1e-3)

    def test_metropolitan_correction_is_3db(self):
        medium = rf_physics.calculate_cost231_loss(5000, 1800, 50, 1.5, 'urban_small')
        metro = rf_physics.calculate_cost231_loss(5000, 1800, 50, 1.5, 'urban_large')
        assert metro - medium == pytest.approx(3.0, abs=1e-9)

    def test_no_suburban_or_rural_term(self):
        medium = rf_physics.calculate_cost231_loss(5000, 1800, 50, 1.5, 'urban_small')
        assert rf_physics.calculate_cost231_loss(5000, 1800, 50, 1.5, 'suburban') == pytest.approx(medium)
        assert rf_physics.calculate_cost231_loss(5000, 1800, 50, 1.5, 'rural') == pytest.approx(medium)

    def test_higher_loss_than_hata_at_900(self):
        hata_900 = rf_physics.calculate_hata_loss(5000, 900, 50, 1.5, 'urban_small')
        cost_1800 = rf_physics.calculate_cost231_loss(5000, 1800, 50, 1.5, 'urban_small')
        assert cost_1800 > hata_900


class TestHataFamilyDispatch:
    def test_below_crossover_uses_hata(self):
        assert rf_physics.calculate_hata_family_loss(5000, 915, 50, 1.5, 'suburban') == pytest.approx(
            rf_physics.calculate_hata_loss(5000, 915, 50, 1.5, 'suburban')
        )

    def test_at_and_above_crossover_uses_cost231(self):
        for freq in (1500, 1800):
            assert rf_physics.calculate_hata_family_loss(5000, freq, 50, 1.5, 'urban_small') == pytest.approx(
                rf_physics.calculate_cost231_loss(5000, freq, 50, 1.5, 'urban_small')
            )


class TestPathLossDispatcher:
    ELEVS = [100.0] * 20

    def test_hata_model_auto_extends_above_1500mhz(self):
        loss = rf_physics.calculate_path_loss(
            5000, self.ELEVS, 1800, 50, 1.5, model='hata', environment='urban_small'
        )
        assert loss == pytest.approx(
            rf_physics.calculate_cost231_loss(5000, 1800, 50, 1.5, 'urban_small')
        )

    def test_explicit_cost231_model(self):
        loss = rf_physics.calculate_path_loss(
            5000, self.ELEVS, 1800, 50, 1.5, model='cost231', environment='urban_small'
        )
        assert loss == pytest.approx(
            rf_physics.calculate_cost231_loss(5000, 1800, 50, 1.5, 'urban_small')
        )

    def test_fspl_model_unchanged(self):
        loss = rf_physics.calculate_path_loss(
            5000, self.ELEVS, 915, 50, 1.5, model='fspl'
        )
        expected = 20 * math.log10(5.0) + 20 * math.log10(915) + 32.45
        assert loss == pytest.approx(expected, abs=1e-9)

    def test_bullington_adds_diffraction_to_fspl(self):
        # Flat terrain -> no diffraction, so bullington collapses to FSPL
        loss = rf_physics.calculate_path_loss(
            5000, self.ELEVS, 915, 50, 1.5, model='bullington'
        )
        fspl = rf_physics.calculate_path_loss(
            5000, self.ELEVS, 915, 50, 1.5, model='fspl'
        )
        assert loss >= fspl
