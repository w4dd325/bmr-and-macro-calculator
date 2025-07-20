// Global variables
let targetMacros = { protein: 0, fats: 0, carbs: 0 };
let macroChart = null;
let calculatedBMR = 0;
let calculatedTDEE = 0;
let calculatedCalorieGoal = 0;

// Auto-save functionality
function saveToLocalStorage() {
    try {
        const data = {
            personalInfo: {
                sex: document.getElementById('sex').value,
                age: document.getElementById('age').value,
                weight: document.getElementById('weight').value,
                weightUnit: document.getElementById('weightUnit').value,
                height: document.getElementById('height').value,
                heightUnit: document.getElementById('heightUnit').value,
                activity: document.getElementById('activity').value,
                deficit: document.getElementById('deficit').value
            },
            calculatedValues: {
                bmr: calculatedBMR,
                tdee: calculatedTDEE,
                calorieGoal: calculatedCalorieGoal
            },
            targetMacros: targetMacros,
            meals: collectMealData(),
            lastSaved: new Date().toISOString()
        };
        
        localStorage.setItem('bmr-calculator-data', JSON.stringify(data));
    } catch (error) {
        console.warn('Failed to save to localStorage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('bmr-calculator-data');
        if (!saved) return false;
        
        const data = JSON.parse(saved);
        
        // Load personal info
        if (data.personalInfo) {
            document.getElementById('sex').value = data.personalInfo.sex || 'male';
            document.getElementById('age').value = data.personalInfo.age || '';
            document.getElementById('weight').value = data.personalInfo.weight || '';
            document.getElementById('weightUnit').value = data.personalInfo.weightUnit || 'kg';
            document.getElementById('height').value = data.personalInfo.height || '';
            document.getElementById('heightUnit').value = data.personalInfo.heightUnit || 'cm';
            document.getElementById('activity').value = data.personalInfo.activity || '1.2';
            document.getElementById('deficit').value = data.personalInfo.deficit || '0';
        }
        
        // Load calculated values
        if (data.calculatedValues) {
            calculatedBMR = data.calculatedValues.bmr || 0;
            calculatedTDEE = data.calculatedValues.tdee || 0;
            calculatedCalorieGoal = data.calculatedValues.calorieGoal || 0;
            
            if (calculatedBMR > 0) {
                displayBMRResults();
            }
        }
        
        // Load target macros
        if (data.targetMacros) {
            targetMacros = data.targetMacros;
            document.getElementById('targetProtein').value = targetMacros.protein || 0;
            document.getElementById('targetFats').value = targetMacros.fats || 0;
            document.getElementById('targetCarbs').value = targetMacros.carbs || 0;
        }
        
        // Load meal data
        if (data.meals) {
            loadMealData(data.meals);
        }
        
        // Show sections if data was loaded
        if (calculatedBMR > 0) {
            document.getElementById('macroSection').classList.remove('hidden');
            document.getElementById('foodSection').classList.remove('hidden');
            document.getElementById('resultsSection').classList.remove('hidden');
            
            // Update chart
            if (macroChart) {
                macroChart.data.datasets[0].data = [targetMacros.protein, targetMacros.fats, targetMacros.carbs];
                macroChart.update();
            }
            
            calculateMacros();
        }
        
        return true;
    } catch (error) {
        console.warn('Failed to load from localStorage:', error);
        return false;
    }
}

function collectMealData() {
    const meals = ['breakfast', 'lunch', 'dinner', 'snacks'];
    const mealData = {};
    
    meals.forEach(meal => {
        const container = document.getElementById(meal + 'Container');
        const foodItems = container.querySelectorAll('.food-item');
        mealData[meal] = [];
        
        foodItems.forEach(item => {
            const name = item.querySelector('.food-name').value;
            const protein = item.querySelector(`.${meal}-protein`).value;
            const fats = item.querySelector(`.${meal}-fats`).value;
            const carbs = item.querySelector(`.${meal}-carbs`).value;
            
            if (name || protein || fats || carbs) {
                mealData[meal].push({ name, protein, fats, carbs });
            }
        });
    });
    
    return mealData;
}

function loadMealData(mealData) {
    const meals = ['breakfast', 'lunch', 'dinner', 'snacks'];
    
    meals.forEach(meal => {
        const container = document.getElementById(meal + 'Container');
        container.innerHTML = '';
        
        if (mealData[meal] && mealData[meal].length > 0) {
            mealData[meal].forEach((foodItem) => {
                const foodItemDiv = document.createElement('div');
                foodItemDiv.className = 'food-item';
                foodItemDiv.innerHTML = `
                    <div class="food-row">
                        <div class="food-col">
                            <input type="text" class="food-name" placeholder="e.g., Food item" value="${foodItem.name || ''}">
                        </div>
                        <div class="food-col">
                            <input type="number" class="protein-input ${meal}-protein" min="0" max="999" step="any" value="${foodItem.protein || ''}">
                        </div>
                        <div class="food-col">
                            <input type="number" class="fats-input ${meal}-fats" min="0" max="999" step="any" value="${foodItem.fats || ''}">
                        </div>
                        <div class="food-col">
                            <input type="number" class="carbs-input ${meal}-carbs" min="0" max="999" step="any" value="${foodItem.carbs || ''}">
                        </div>
                        <div class="food-col">
                            <button type="button" class="remove-food-btn" onclick="removeFoodItem(this)" title="Remove this food item">×</button>
                        </div>
                    </div>
                `;
                container.appendChild(foodItemDiv);
            });
        } else {
            // Add empty meal item if no saved items
            addEmptyMealItem(meal);
        }
    });
}

function addEmptyMealItem(meal) {
    const container = document.getElementById(meal + 'Container');
    const foodItemDiv = document.createElement('div');
    foodItemDiv.className = 'food-item';
    foodItemDiv.innerHTML = `
        <div class="food-row">
            <div class="food-col">
                <input type="text" class="food-name" placeholder="e.g., Food item">
            </div>
            <div class="food-col">
                <input type="number" class="protein-input ${meal}-protein" min="0" max="999" step="any">
            </div>
            <div class="food-col">
                <input type="number" class="fats-input ${meal}-fats" min="0" max="999" step="any">
            </div>
            <div class="food-col">
                <input type="number" class="carbs-input ${meal}-carbs" min="0" max="999" step="any">
            </div>
            <div class="food-col">
                <button type="button" class="remove-food-btn" onclick="removeFoodItem(this)" title="Remove this food item">×</button>
            </div>
        </div>
    `;
    container.appendChild(foodItemDiv);
}

function displayBMRResults() {
    document.getElementById('bmrResults').innerHTML = `
        <h3>Your Results</h3>
        <div class="bmr-stats">
            <div class="bmr-stat">
                <h4>BMR</h4>
                <p>${calculatedBMR.toFixed(0)} kcal/day</p>
            </div>
            <div class="bmr-stat">
                <h4>TDEE</h4>
                <p>${calculatedTDEE.toFixed(0)} kcal/day</p>
            </div>
            <div class="bmr-stat">
                <h4>Calorie Goal</h4>
                <p>${calculatedCalorieGoal.toFixed(0)} kcal/day</p>
            </div>
        </div>
    `;
}

// Auto-save triggers
function setupAutoSave() {
    // Save on form changes
    const formInputs = ['sex', 'age', 'weight', 'weightUnit', 'height', 'heightUnit', 'activity', 'deficit'];
    formInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', saveToLocalStorage);
        }
    });
    
    // Save on target macro changes
    ['targetProtein', 'targetFats', 'targetCarbs'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', saveToLocalStorage);
        }
    });
    
    // Save on food input changes (debounced)
    let saveTimeout;
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('food-name') || 
            e.target.classList.contains('protein-input') || 
            e.target.classList.contains('fats-input') || 
            e.target.classList.contains('carbs-input')) {
            
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveToLocalStorage, 1000); // Save after 1 second of inactivity
        }
    });
}

// Dark mode functionality
document.getElementById('darkModeToggle').addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    this.textContent = isDarkMode ? '☀️' : '🌙';
    localStorage.setItem('darkMode', isDarkMode);
});

// Load dark mode preference on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').textContent = '☀️';
    }
    
    // Initialize chart
    initChart();
    
    // Load saved data from localStorage
    loadFromLocalStorage();
    
    // Setup auto-save functionality
    setupAutoSave();
    
    // Initial summary update
    updateMacroSummary();
});

// BMR Form submission
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
    let weightKg = weight;
    if (weightUnit === 'lbs') weightKg = weight * 0.453592;
    if (heightUnit === 'in') height = height * 2.54;

    // Calculate BMR (Mifflin-St Jeor)
    let bmr;
    if (sex === 'male') {
        bmr = 10 * weightKg + 6.25 * height - 5 * age + 5;
    } else {
        bmr = 10 * weightKg + 6.25 * height - 5 * age - 161;
    }

    // Calculate TDEE and calorie goal
    const tdee = bmr * activity;
    const calorieGoal = tdee - deficit;

    // Store calculated values
    calculatedBMR = bmr;
    calculatedTDEE = tdee;
    calculatedCalorieGoal = calorieGoal;

    // Calculate macros
    const proteinPerKg = 2;
    const proteinGrams = Math.round(proteinPerKg * weightKg);
    const proteinCals = proteinGrams * 4;
    const fatPercent = 0.25;
    const fatCals = calorieGoal * fatPercent;
    const fatGrams = Math.round(fatCals / 9);
    const carbsCals = calorieGoal - (proteinCals + fatCals);
    const carbsGrams = Math.round(carbsCals / 4);

    // Display BMR results
    displayBMRResults();

    // Auto-populate target macros
    document.getElementById('targetProtein').value = proteinGrams;
    document.getElementById('targetFats').value = fatGrams;
    document.getElementById('targetCarbs').value = carbsGrams;

    // Set target macros
    targetMacros = { protein: proteinGrams, fats: fatGrams, carbs: carbsGrams };

    // Update chart with targets
    if (macroChart) {
        macroChart.data.datasets[0].data = [proteinGrams, fatGrams, carbsGrams];
        macroChart.update();
    }

    // Show macro and food sections
    document.getElementById('macroSection').classList.remove('hidden');
    document.getElementById('foodSection').classList.remove('hidden');
    document.getElementById('resultsSection').classList.remove('hidden');

    updateMacroSummary();

    // Auto-save data
    saveToLocalStorage();

    // Scroll to macro section
    document.getElementById('macroSection').scrollIntoView({ behavior: 'smooth' });
});

// Initialize chart
function initChart() {
    const ctx = document.getElementById('macroChart').getContext('2d');
    macroChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Protein', 'Fats', 'Carbs'],
            datasets: [{
                label: 'Target',
                data: [0, 0, 0],
                backgroundColor: 'rgba(25, 118, 210, 0.3)',
                borderColor: 'rgba(25, 118, 210, 1)',
                borderWidth: 2
            }, {
                label: 'Actual',
                data: [0, 0, 0],
                backgroundColor: 'rgba(76, 175, 80, 0.3)',
                borderColor: 'rgba(76, 175, 80, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Grams'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'Target vs Actual Macros'
                }
            }
        }
    });
}

// Edit targets functionality
document.getElementById('editTargets').addEventListener('click', function() {
    document.getElementById('targetProtein').readOnly = false;
    document.getElementById('targetFats').readOnly = false;
    document.getElementById('targetCarbs').readOnly = false;
    document.getElementById('editTargets').classList.add('hidden');
    document.getElementById('confirmTargets').classList.remove('hidden');
});

document.getElementById('confirmTargets').addEventListener('click', function() {
    const protein = parseFloat(document.getElementById('targetProtein').value) || 0;
    const fats = parseFloat(document.getElementById('targetFats').value) || 0;
    const carbs = parseFloat(document.getElementById('targetCarbs').value) || 0;
    
    targetMacros = { protein, fats, carbs };
    
    document.getElementById('targetProtein').readOnly = true;
    document.getElementById('targetFats').readOnly = true;
    document.getElementById('targetCarbs').readOnly = true;
    document.getElementById('editTargets').classList.remove('hidden');
    document.getElementById('confirmTargets').classList.add('hidden');
    
    if (macroChart) {
        macroChart.data.datasets[0].data = [protein, fats, carbs];
        macroChart.update();
    }
    
    updateMacroSummary();
    saveToLocalStorage();
});

// Add event listeners for meal items
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('add-meal-item')) {
        const mealType = e.target.getAttribute('data-meal');
        addMealItem(mealType);
    }
});

// Add new meal item
function addMealItem(mealType) {
    const container = document.getElementById(mealType + 'Container');
    
    const foodItemDiv = document.createElement('div');
    foodItemDiv.className = 'food-item';
    foodItemDiv.innerHTML = `
        <div class="food-row">
            <div class="food-col">
                <input type="text" class="food-name" placeholder="e.g., Food item">
            </div>
            <div class="food-col">
                <input type="number" class="protein-input ${mealType}-protein" min="0" max="999" step="any">
            </div>
            <div class="food-col">
                <input type="number" class="fats-input ${mealType}-fats" min="0" max="999" step="any">
            </div>
            <div class="food-col">
                <input type="number" class="carbs-input ${mealType}-carbs" min="0" max="999" step="any">
            </div>
            <div class="food-col">
                <button type="button" class="remove-food-btn" onclick="removeFoodItem(this)" title="Remove this food item">×</button>
            </div>
        </div>
    `;
    
    container.appendChild(foodItemDiv);
    saveToLocalStorage();
}

// Remove food item (updated for meal structure)
function removeFoodItem(button) {
    const foodItem = button.closest('.food-item');
    const container = button.closest('.meal-container');
    
    if (container.children.length > 1) {
        foodItem.remove();
    } else {
        const inputs = foodItem.querySelectorAll('input');
        inputs.forEach(input => input.value = '');
    }
    
    calculateMacros();
    saveToLocalStorage();
}

// Reset all food items (updated for meal structure)
document.getElementById('resetFood').addEventListener('click', function() {
    const meals = ['breakfast', 'lunch', 'dinner', 'snacks'];
    
    meals.forEach(meal => {
        const container = document.getElementById(meal + 'Container');
        container.innerHTML = '';
        addEmptyMealItem(meal);
    });
    
    calculateMacros();
    saveToLocalStorage();
});

// Calculate total macros
function calculateMacros() {
    const proteinInputs = document.querySelectorAll('.protein-input');
    const fatsInputs = document.querySelectorAll('.fats-input');
    const carbsInputs = document.querySelectorAll('.carbs-input');
    
    let totalProtein = 0;
    let totalFats = 0;
    let totalCarbs = 0;
    
    proteinInputs.forEach(input => {
        totalProtein += parseFloat(input.value) || 0;
    });
    
    fatsInputs.forEach(input => {
        totalFats += parseFloat(input.value) || 0;
    });
    
    carbsInputs.forEach(input => {
        totalCarbs += parseFloat(input.value) || 0;
    });
    
    if (macroChart) {
        macroChart.data.datasets[1].data = [totalProtein, totalFats, totalCarbs];
        macroChart.update();
    }
    
    updateMacroSummary(totalProtein, totalFats, totalCarbs);
}

// Update macro summary display with meal breakdown
function updateMacroSummary(actualProtein = 0, actualFats = 0, actualCarbs = 0) {
    const summaryDiv = document.getElementById('macroSummary');
    
    const proteinDiff = actualProtein - targetMacros.protein;
    const fatsDiff = actualFats - targetMacros.fats;
    const carbsDiff = actualCarbs - targetMacros.carbs;
    
    const proteinPercent = targetMacros.protein > 0 ? (actualProtein / targetMacros.protein * 100) : 0;
    const fatsPercent = targetMacros.fats > 0 ? (actualFats / targetMacros.fats * 100) : 0;
    const carbsPercent = targetMacros.carbs > 0 ? (actualCarbs / targetMacros.carbs * 100) : 0;
    
    function getColorClass(percent) {
        if (percent >= 90 && percent <= 110) {
            return 'on-target';
        } else if (percent > 110) {
            return 'positive';
        } else {
            return 'negative';
        }
    }
    
    // Calculate meal breakdowns
    const mealBreakdown = calculateMealBreakdown();
    
    summaryDiv.innerHTML = `
        <h3>Macro Summary</h3>
        <div class="macro-stats">
            <div class="macro-stat">
                <h4>Protein</h4>
                <p>Target: ${targetMacros.protein}g</p>
                <p>Actual: ${actualProtein.toFixed(1)}g</p>
                <p class="${getColorClass(proteinPercent)}">
                    ${proteinDiff >= 0 ? '+' : ''}${proteinDiff.toFixed(1)}g 
                    (${proteinPercent.toFixed(0)}%)
                </p>
            </div>
            <div class="macro-stat">
                <h4>Fats</h4>
                <p>Target: ${targetMacros.fats}g</p>
                <p>Actual: ${actualFats.toFixed(1)}g</p>
                <p class="${getColorClass(fatsPercent)}">
                    ${fatsDiff >= 0 ? '+' : ''}${fatsDiff.toFixed(1)}g 
                    (${fatsPercent.toFixed(0)}%)
                </p>
            </div>
            <div class="macro-stat">
                <h4>Carbs</h4>
                <p>Target: ${targetMacros.carbs}g</p>
                <p>Actual: ${actualCarbs.toFixed(1)}g</p>
                <p class="${getColorClass(carbsPercent)}">
                    ${carbsDiff >= 0 ? '+' : ''}${carbsDiff.toFixed(1)}g 
                    (${carbsPercent.toFixed(0)}%)
                </p>
            </div>
        </div>
        
        <div class="meal-breakdown">
            <h4>Meal Breakdown</h4>
            <div class="meal-stats">
                <div class="meal-stat">
                    <h5>🌅 Breakfast</h5>
                    <p>P: ${mealBreakdown.breakfast.protein}g | F: ${mealBreakdown.breakfast.fats}g | C: ${mealBreakdown.breakfast.carbs}g</p>
                    <small>Total: ${(mealBreakdown.breakfast.protein * 4 + mealBreakdown.breakfast.fats * 9 + mealBreakdown.breakfast.carbs * 4).toFixed(0)} cal</small>
                </div>
                <div class="meal-stat">
                    <h5>☀️ Lunch</h5>
                    <p>P: ${mealBreakdown.lunch.protein}g | F: ${mealBreakdown.lunch.fats}g | C: ${mealBreakdown.lunch.carbs}g</p>
                    <small>Total: ${(mealBreakdown.lunch.protein * 4 + mealBreakdown.lunch.fats * 9 + mealBreakdown.lunch.carbs * 4).toFixed(0)} cal</small>
                </div>
                <div class="meal-stat">
                    <h5>🌙 Dinner</h5>
                    <p>P: ${mealBreakdown.dinner.protein}g | F: ${mealBreakdown.dinner.fats}g | C: ${mealBreakdown.dinner.carbs}g</p>
                    <small>Total: ${(mealBreakdown.dinner.protein * 4 + mealBreakdown.dinner.fats * 9 + mealBreakdown.dinner.carbs * 4).toFixed(0)} cal</small>
                </div>
                <div class="meal-stat">
                    <h5>🍿 Snacks</h5>
                    <p>P: ${mealBreakdown.snacks.protein}g | F: ${mealBreakdown.snacks.fats}g | C: ${mealBreakdown.snacks.carbs}g</p>
                    <small>Total: ${(mealBreakdown.snacks.protein * 4 + mealBreakdown.snacks.fats * 9 + mealBreakdown.snacks.carbs * 4).toFixed(0)} cal</small>
                </div>
            </div>
        </div>
    `;
}

// Calculate meal breakdown
function calculateMealBreakdown() {
    const meals = ['breakfast', 'lunch', 'dinner', 'snacks'];
    const breakdown = {};
    
    meals.forEach(meal => {
        const proteinInputs = document.querySelectorAll(`.${meal}-protein`);
        const fatsInputs = document.querySelectorAll(`.${meal}-fats`);
        const carbsInputs = document.querySelectorAll(`.${meal}-carbs`);
        
        let protein = 0, fats = 0, carbs = 0;
        
        proteinInputs.forEach(input => protein += parseFloat(input.value) || 0);
        fatsInputs.forEach(input => fats += parseFloat(input.value) || 0);
        carbsInputs.forEach(input => carbs += parseFloat(input.value) || 0);
        
        breakdown[meal] = { protein, fats, carbs };
    });
    
    return breakdown;
}

// Calculate macros on button click
document.getElementById('calculateMacros').addEventListener('click', calculateMacros);

// Clear all data
document.getElementById('clearData').addEventListener('click', function() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        localStorage.removeItem('bmr-calculator-data');
        location.reload();
    }
});

// Export data functionality
document.getElementById('exportData').addEventListener('click', function() {
    try {
        const data = localStorage.getItem('bmr-calculator-data');
        if (!data) {
            alert('No data to export. Please enter some information first.');
            return;
        }
        
        const dataStr = data;
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `bmr-profile-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    } catch (error) {
        alert('Error exporting data: ' + error.message);
    }
});

// Import data functionality
document.getElementById('importData').addEventListener('click', function() {
    // Check if File API is supported
    if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
        alert('File reading is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Safari.');
        return;
    }
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate data structure
            if (!data.personalInfo && !data.targetMacros && !data.meals) {
                alert('Invalid file format. Please select a valid BMR profile file.');
                return;
            }
            
            // Save to localStorage
            localStorage.setItem('bmr-calculator-data', JSON.stringify(data));
            
            // Reload page to load the imported data
            alert('Data imported successfully! The page will reload to show your imported data.');
            location.reload();
            
        } catch (error) {
            alert('Error importing data: Invalid file format');
            console.error('Error importing data:', error);
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    e.target.value = '';
});
