#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <cstdint>
#include "meshrf_itm.h"
#include "meshrf_viewshed.h"
#include "meshrf_coverage.h"
#include <vector>

using namespace emscripten;

// External declarations
std::vector<int> optimize_site_selection(const float* coverage_matrix, int num_candidates, int num_targets);

EMSCRIPTEN_BINDINGS(meshrf_module) {
    
    // Bind LinkParameters Struct as Class with Constructor
    class_<LinkParameters>("LinkParameters")
        .constructor<>()
        .property("frequency_mhz", &LinkParameters::frequency_mhz)
        .property("tx_height_m", &LinkParameters::tx_height_m)
        .property("rx_height_m", &LinkParameters::rx_height_m)
        .property("polarization", &LinkParameters::polarization)
        .property("step_size_m", &LinkParameters::step_size_m)
        .property("N_0", &LinkParameters::N_0)
        .property("epsilon", &LinkParameters::epsilon)
        .property("sigma", &LinkParameters::sigma)
        .property("climate", &LinkParameters::climate)
        // Statistical variability (ROADMAP P4-6). Optional on the JS side --
        // omitting them keeps the median 50/50/50 prediction.
        .property("time_pct", &LinkParameters::time_pct)
        .property("loc_pct", &LinkParameters::loc_pct)
        .property("sit_pct", &LinkParameters::sit_pct)
        .property("mdvar", &LinkParameters::mdvar)
        ;

    // Register Vector types
    register_vector<float>("VectorFloat");
    register_vector<uint8_t>("VectorUint8");
    register_vector<int>("VectorInt");
    
    // ITM Radial Loss Calculation
    function("calculate_itm", optional_override([](uintptr_t profile_ptr, int count, LinkParameters params) {
        float* profile = reinterpret_cast<float*>(profile_ptr);
        return calculate_radial_loss(profile, count, params);
    }));

    // Simple Viewshed (Line-of-Sight)
    function("calculate_viewshed", optional_override([](uintptr_t elev_ptr, int width, int height, int tx_x, int tx_y, float tx_h, int max_dist, float gsd_meters) {
        float* elev = reinterpret_cast<float*>(elev_ptr);
        return calculate_viewshed(elev, width, height, tx_x, tx_y, tx_h, max_dist, gsd_meters);
    }));
    
    // RF Coverage (ITM-based propagation)
    function("calculate_rf_coverage", optional_override([](
        uintptr_t elev_ptr,
        int width,
        int height,
        int tx_x,
        int tx_y,
        float tx_h,
        float rx_h,
        float freq_mhz,
        float tx_power_dbm,
        float tx_gain_dbi,
        float rx_gain_dbi,
        float rx_sensitivity,
        int max_dist,
        float gsd_meters,
        float epsilon,
        float sigma,
        int climate,
        float time_pct,
        float loc_pct,
        float sit_pct
    ) {
        float* elev = reinterpret_cast<float*>(elev_ptr);
        return calculate_rf_coverage(
            elev, width, height, tx_x, tx_y, tx_h, rx_h,
            freq_mhz, tx_power_dbm, tx_gain_dbi, rx_gain_dbi,
            rx_sensitivity, max_dist, gsd_meters,
            epsilon, sigma, climate,
            time_pct, loc_pct, sit_pct
        );
    }));

}
