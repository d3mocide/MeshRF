
/**
 * Determines the color and style of a link based on its budget analysis.
 * @param {Object} budget - The link budget object (margin, etc.)
 * @param {Object} linkStats - Additional stats like obstruction status.
 * @param {number} diffractionLoss - Calculated diffraction loss.
 * @returns {Object} { color, dashArray, isBadLink }
 */
export const getLinkStyle = (budget, linkStats, diffractionLoss) => {
    let finalColor = '#00ff41';
    let isBadLink = false;

    // 1. Obstruction Check (Overrides everything)
    if (linkStats.isObstructed || (linkStats.linkQuality && linkStats.linkQuality.includes('Obstructed'))) {
        finalColor = '#ff0000';
        isBadLink = true;
    }
    // 2. Margin-based Coloring
    else {
        const m = budget.margin - diffractionLoss; // Adjust margin by diffraction loss
        if (m >= 10) {
            finalColor = '#00ff41'; // Excellent +++
        } else if (m >= 5) {
            finalColor = '#00ff41'; // Good ++
        } else if (m >= 0) {
            finalColor = '#eeff00'; // Fair + (Yellow)
        } else if (m >= -10) {
            finalColor = '#ffbf00'; // Marginal -+ (Orange)
            isBadLink = false; // It's marginal, but established. Not "broken".
        } else {
            finalColor = '#ff0000'; // No Signal - (Red)
            isBadLink = true;
        }
    }

    // Dash line if it's a "Bad" link (No Signal or Physical Obstruction)
    const dashArray = isBadLink ? '10, 10' : null;

    return { color: finalColor, dashArray, isBadLink };
};
