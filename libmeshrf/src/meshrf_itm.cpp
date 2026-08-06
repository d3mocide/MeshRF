#include "meshrf_itm.h"
#include "itm.h"
#include <cmath>
#include <vector>

// Helper to convert float profile subset to ITM double pfl format
// pfl[0] = num_points
// pfl[1] = step_size
// pfl[2..] = elevations
void prepare_itm_pfl(double* pfl_buffer, float* input_profile, int count, double step_size) {
    pfl_buffer[0] = (double)count;
    pfl_buffer[1] = step_size;
    for (int i = 0; i < count; i++) {
        pfl_buffer[i + 2] = (double)input_profile[i];
    }
}

std::vector<float> calculate_radial_loss(float* terrain_profile, int profile_length, LinkParameters params) {
    std::vector<float> results(profile_length);
    
    // Validate inputs
    if (profile_length < 2) {
        return results; // Return zeros or empty
    }

    // ITM Variables
    double A_db = 0.0;
    long warnings = 0;
    
    // ITM requires a buffer for the profile. 
    // Max buffer needed is profile_length + 2.
    // We reuse this buffer to avoid reallocating, but for each step 'i', 
    // we effectively use the first i+3 elements.
    std::vector<double> pfl_buffer(profile_length + 2);

    // Variability parameters come from the caller (ROADMAP P4-6); LinkParameters
    // defaults them to the median 50/50/50 prediction with mdvar=12, which is
    // what this function previously hardcoded.
    // mdvar:
    // 0 - Single message
    // 1 - Accidental
    // 2 - Mobile
    // 3 - Broadcast
    int mdvar = params.mdvar;

    // Time/Loc/Sit: percentage of time/locations/situations for which the
    // predicted loss is NOT exceeded.
    double time_pct = params.time_pct;
    double loc_pct = params.loc_pct;
    double sit_pct = params.sit_pct;

    // Result at index 0 (TX) is 0 loss
    results[0] = 0.0f;

    // Iterate along the profile
    // ITM requires at least 2 points (TX and RX)
    for (int i = 1; i < profile_length; i++) {
        // Construct PFL for link from 0 to i
        // Number of points = i + 1 (indices 0 to i)
        int current_count = i + 1;
        
        // Populate buffer
        prepare_itm_pfl(pfl_buffer.data(), terrain_profile, current_count, params.step_size_m);
        
        // ITM P2P Call
        // Note: pfl_buffer now contains the profile from TX to current point 'i'.
        // RX height is at point 'i'. TX height is at point 0.
        
        int err = ITM_P2P_TLS(
            params.tx_height_m,
            params.rx_height_m,
            pfl_buffer.data(),
            params.climate,
            params.N_0,
            params.frequency_mhz,
            params.polarization,
            params.epsilon,
            params.sigma,
            mdvar,
            time_pct,
            loc_pct,
            sit_pct,
            &A_db,
            &warnings
        );

        if (err == 0 || err == 1) { // 0=Success, 1=Success with warnings
            results[i] = (float)A_db;
        } else {
            // Check error codes. For now, mark as -1.0 or huge loss?
            // ITM errors often mean bad geometry or parameters.
            results[i] = 999.9f; 
        }
    }

    return results;
}
