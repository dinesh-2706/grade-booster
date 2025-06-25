const themeSwitch = document.getElementById("flexSwitchCheckDefault");

// 🔁 Load user's saved theme on page load
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
    themeSwitch.checked = true;
  } else {
    document.body.classList.remove("dark-theme");
    themeSwitch.checked = false;
  }
});

// 🎯 Listen for toggle switch changes
themeSwitch.addEventListener("change", function () {
  if (this.checked) {
    document.body.classList.add("dark-theme");
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.remove("dark-theme");
    localStorage.setItem("theme", "light");
  }
});

// Get select elements
const semesterSelect = document.getElementById("semester");
const courseTypeSelect = document.getElementById("courseType");

// Get all externals sections (3 variations)
const externalsRegular = document.querySelectorAll("div.card")[1]; // CAT-1, CAT-2, FAT
const externalsLong = document.querySelectorAll("div.card")[2];    // CAT, FAT
const externalsShort = document.querySelectorAll("div.card")[3];   // Only FAT

// Get lab and project component cards
const labComponent = document.querySelectorAll("div.card")[5];      // LAB COMPONENT
const projectComponent = document.querySelectorAll("div.card")[6];  // PROJECT COMPONENT

// Function to handle semester change
semesterSelect.addEventListener("change", () => {
  // Hide all externals first
  externalsRegular.style.display = "none";
  externalsLong.style.display = "none";
  externalsShort.style.display = "none";

  const value = semesterSelect.value;

  // Show based on selected semester
  if (value === "regular") {
    externalsRegular.style.display = "block";
  } else if (value === "long") {
    externalsLong.style.display = "block";
  } else if (value === "short") {
    externalsShort.style.display = "block";
  }
});

// Function to handle course type change
courseTypeSelect.addEventListener("change", () => {
  // Hide both components by default
  labComponent.style.display = "none";
  projectComponent.style.display = "none";

  const value = courseTypeSelect.value;

  if (value === "theolab") {
    labComponent.style.display = "block";
  } else if (value === "theopro") {
    projectComponent.style.display = "block";
  }
});

//Validation
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("gradeForm");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    event.stopPropagation();

    if (form.checkValidity()) {
      calculate(); // Call your function only if form is valid
    }

    form.classList.add("was-validated"); // Bootstrap visual cue
  });
});

window.addEventListener("load", () => {
  const form = document.getElementById("gradeForm");
  form.reset();
});

// Academic Grade Calculator Script

let componentCount = 0;

window.addEventListener('DOMContentLoaded', () => {
  const gradeForm = document.getElementById('gradeForm');
  const semesterSelect = document.getElementById('semester');
  const courseTypeSelect = document.getElementById('courseType');
  const internalComponentsDiv = document.getElementById('internalComponents');
  const addComponentBtn = document.getElementById('addComponentBtn');
  const outputDiv = document.getElementById('output');

  // Sanitize input to prevent XSS
  const sanitize = (str) => str.replace(/[^a-zA-Z0-9 \-_\.]/g, '');

  // Add new internal component input set
  addComponentBtn.addEventListener('click', () => {
    componentCount++;
    const componentDiv = document.createElement('div');
    componentDiv.className = 'mb-2 p-2 position-relative';

    componentDiv.innerHTML = `
    <!-- Remove button -->
    <span class="remove-component position-absolute top-0 end-0 mx-3 fs-1 text-danger" role="button" title="Remove Component">&times;</span>

    <h5 class="mb-3 text-info">Component ${componentCount}</h5>
    <div class="row g-3">
      <div class="col-md-4">
        <div class="form-floating">
          <input type="number" class="form-control" id="obtained-${componentCount}" min="0" step="any" placeholder="Obtained Marks" required>
          <label for="obtained-${componentCount}">Obtained Marks</label>
          <div class="invalid-feedback">Please enter valid marks.</div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="form-floating">
          <input type="number" class="form-control" id="total-${componentCount}" min="0" step="any" placeholder="Total Marks" required>
          <label for="total-${componentCount}">Total Marks</label>
          <div class="invalid-feedback">Please enter valid marks.</div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="form-floating">
          <input type="number" class="form-control" id="weight-${componentCount}" min="0" max="100" step="any" placeholder="Weightage %" required>
          <label for="weight-${componentCount}">Weightage %</label>
          <div class="invalid-feedback">Please enter valid max weightage.</div>
        </div>
      </div>
    </div>
  `;

    // Add the component to the container
    internalComponentsDiv.appendChild(componentDiv);

    // Add remove functionality to this component
    const removeBtn = componentDiv.querySelector('.remove-component');
    removeBtn.addEventListener('click', () => {
      componentDiv.remove();
    });
  });

  // Utility function to get parsed input value
  const getInputValue = (id) => {
    const el = document.getElementById(id);
    return el && el.value ? parseFloat(el.value) : 0;
  };

  // Weighted calculation helper
  const calcWeightedScore = (obtained, total, weightage) =>
    total > 0 ? (obtained / total) * weightage : 0;

  // Main grade calculation logic
  const calculateMarks = () => {
    const semester = sanitize(semesterSelect.value);
    const courseType = sanitize(courseTypeSelect.value);

    let totalScore = 0;
    let internalWeight = 0;
    let fatScore = 0;

    // External scores
    if (semester === 'regular') {
      totalScore += calcWeightedScore(getInputValue('cat1-regular'), 50, 15);
      totalScore += calcWeightedScore(getInputValue('cat2-regular'), 50, 15);
      fatScore = getInputValue('fat-regular');
      totalScore += calcWeightedScore(fatScore, 100, 40);
      internalWeight = 30;
    } else if (semester === 'long') {
      totalScore += calcWeightedScore(getInputValue('cat-long'), 50, 20);
      fatScore = getInputValue('fat-long');
      totalScore += calcWeightedScore(fatScore, 100, 40);
      internalWeight = 40;
    } else if (semester === 'short') {
      fatScore = getInputValue('fat-short');
      totalScore += calcWeightedScore(fatScore, 100, 40);
      internalWeight = 60;
    }

    // Internal components calculation
    let internalScore = 0;
    let totalInternalWeight = 0;
    for (let i = 1; i <= componentCount; i++) {
      const obtained = getInputValue(`obtained-${i}`);
      const total = getInputValue(`total-${i}`);
      const weight = getInputValue(`weight-${i}`);
      internalScore += calcWeightedScore(obtained, total, weight);
      totalInternalWeight += weight;
    }

    if (totalInternalWeight > 0) {
      internalScore = (internalScore / totalInternalWeight) * internalWeight;
      totalScore += internalScore;
    }

    let finalWeightage = 0;

    // Special case for theory only (100%)
    if (courseType === 'theory') {
      finalWeightage = totalScore;
    } else {
      // Scale to 75% main
      const mainScore = (totalScore / 100) * 75;
      let labProjectScore = 0;

      if (courseType === 'theolab') {
        labProjectScore = (getInputValue('labMarks') / 100) * 25;
      } else if (courseType === 'theopro') {
        labProjectScore = (getInputValue('projectMarks') / 100) * 25;
      }

      finalWeightage = mainScore + labProjectScore;
    }

    const requiredGrade = getInputValue('requiredGradeCutoff');
    const requiredRoundedThreshold = requiredGrade - 0.99;
    const roundedFinal = Math.ceil(finalWeightage);

    let fatGainNeeded = 'No extra FAT marks needed';
    let additionalFatMarks = 0;

    if (requiredGrade > 0 && finalWeightage < requiredRoundedThreshold) {
      const neededBoost = requiredRoundedThreshold - finalWeightage;

      let fatMarkImpact = 0;
      if (courseType === 'theory') {
        fatMarkImpact = 40 / 100; // 0.4 per FAT mark
      } else {
        fatMarkImpact = (40 / 100) * 0.75; // 0.3 per FAT mark
      }

      additionalFatMarks = (neededBoost / fatMarkImpact).toFixed(2);
      fatGainNeeded = `<span class="badge bg-warning text-dark">${additionalFatMarks}</span>`;
    }
    // Warnings
    let warningMessages = '';
    let hasCriticalError = false;

    if (courseType === 'theopro') {
      const proj = getInputValue('projectMarks');
      if (!proj || isNaN(proj)) {
        warningMessages += `<p class="text-danger">⚠️ Please enter Project Marks (required for Theoretical + Project courses).</p>`;
        hasCriticalError = true;
      }
    }

    if (courseType === 'theolab') {
      const lab = getInputValue('labMarks');
      if (!lab || isNaN(lab)) {
        warningMessages += `<p class="text-danger">⚠️ Please enter Lab Marks (required for Theoretical + Lab courses).</p>`;
        hasCriticalError = true;
      }
    }

    if (courseType === 'theory' && (componentCount === 0 || totalInternalWeight === 0)) {
      warningMessages += `<p class="text-danger">⚠️ No internal components entered. Please add internal assessments.</p>`;
      hasCriticalError = true;
    }

    if (!requiredGrade || isNaN(requiredGrade)) {
      warningMessages += `<p class="text-warning">⚠️ Required Grade Cutoff is not entered. Calculations for extra FAT marks are skipped.</p>`;
    }

    // If any critical component is missing, skip table output
    if (hasCriticalError) {
      outputDiv.innerHTML = warningMessages;
      return;
    }

    if (additionalFatMarks) {
      var successMessage = `<p class="text-info"><strong>" ${additionalFatMarks} "</strong> more marks needed.</p>`;
    }
    // Render results table
    outputDiv.innerHTML = `
        <div class="table-responsive">
          <table class="table table-bordered">
            <thead>
              <tr>
                <th>Total Weightage (Actual)</th>
                <th>Rounded Weightage</th>
                <th>Required Grade Cutoff</th>
                <th>Extra FAT Marks Needed</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${finalWeightage.toFixed(2)}%</td>
                <td>${roundedFinal}%</td>
                <td>${requiredGrade ? requiredGrade + '%' : '—'}</td>
                <td class="table-warning">${fatGainNeeded}</td>
              </tr>
            </tbody>
          </table>
      </div>
    ${additionalFatMarks ? successMessage : ""}
  `;

    // Append any non-blocking warnings (e.g., missing cutoff)
    outputDiv.innerHTML += warningMessages;
  };

  // Form submit handler
  gradeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    calculateMarks();
  });
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}