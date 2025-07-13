// Dark mode toggle functionality
document.getElementById('darkModeToggle').addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    // Update toggle button icon
    this.textContent = isDarkMode ? '☀️' : '🌙';
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', isDarkMode);
});

// Load dark mode preference on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').textContent = '☀️';
    }
});

document.getElementById('bmrForm').addEventListener('submit', function(e) {
    e.preventDefault();
    // Get form values
    const sex = document.getElementById('sex').value;
    const age = parseInt(document.getElementById('age').value);
    let weight = parseFloat(document.getElementById('weight').value);
    const weightUnit = document.getElementById('weightUnit').value;
    let height = parseFloat(document.getElementById('height').value);
    const heightUnit = document.getElementById('heightUnit').value;
    const activity = parseFloat(document.getElementById('activity').value);
    const deficit = parseInt(document.getElementById('deficit').value);

    // Convert units if needed
    if (weightUnit === 'lbs') weight = weight * 0.453592;
    if (heightUnit === 'in') height = height * 2.54;

    // Calculate BMR (Mifflin-St Jeor)
    let bmr;
    if (sex === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Calculate TDEE
    const tdee = bmr * activity;
    // Calorie goal
    const calorieGoal = tdee - deficit;

    // Macro breakdown
    // Protein: 2g/kg (default, can be adjusted)
    const proteinPerKg = 2;
    const proteinGrams = Math.round(proteinPerKg * weight);
    const proteinCals = proteinGrams * 4;
    // Fat: 25% of calories (default)
    const fatPercent = 0.25;
    const fatCals = calorieGoal * fatPercent;
    const fatGrams = Math.round(fatCals / 9);
    // Carbs: remainder
    const carbsCals = calorieGoal - (proteinCals + fatCals);
    const carbsGrams = Math.round(carbsCals / 4);

    // Output
    document.getElementById('results').innerHTML = `
        <h2>Results</h2>
        <p><strong>BMR:</strong> ${bmr.toFixed(0)} kcal/day</p>
        <p><strong>TDEE:</strong> ${tdee.toFixed(0)} kcal/day</p>
        <p><strong>Calorie Goal:</strong> ${calorieGoal.toFixed(0)} kcal/day</p>
        <h3>Macronutrient Breakdown</h3>
        <ul>
            <li><strong>Protein:</strong> ${proteinGrams}g (${proteinCals} kcal)</li>
            <li><strong>Fat:</strong> ${fatGrams}g (${fatGrams * 9} kcal)</li>
            <li><strong>Carbs:</strong> ${carbsGrams}g (${carbsGrams * 4} kcal)</li>
        </ul>
    `;
});
