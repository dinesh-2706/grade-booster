const componentCounts = { CAT: 0, FAT: 0, Quiz: 0, Assignment: 0 };

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
}

document.getElementById('courseType').addEventListener('change', e => {
  const labSec = document.getElementById('labSection');
  labSec.style.display = e.target.value.includes('lab') || e.target.value.includes('project') ? 'block' : 'none';
});

function addComponent() {
  const nameOptions = ["CAT", "FAT", "Quiz", "Assignment"];
  const container = document.createElement('div');
  container.innerHTML = `
    <hr>
    <div class="flex-row">
      <div>
        <select class="name" onchange="validateComponent(this)">
          <option disabled selected>Select Component</option>
          ${nameOptions.map(opt => `<option value="${opt}">${opt}</option>`).join("")}
        </select>
      </div>
      <div><input type="number" placeholder="Marks Obtained" class="obtained" min="0"></div>
      <div><input type="number" placeholder="Total Marks" class="total" min="1"></div>
      <div><input type="number" placeholder="Weightage (%)" class="weightage" min="1" max="100"></div>
    </div>`;
  document.getElementById('components').appendChild(container);
}

function validateComponent(selectElement) {
  let base = selectElement.value;
  if (!base) return;

  if (base === "FAT") {
    if (componentCounts.FAT >= 1) {
      alert("Only one FAT is allowed.");
      selectElement.value = "";
      return;
    } else {
      componentCounts.FAT = 1;
      selectElement.innerHTML = `<option value="FAT">FAT</option>`;
    }
  }

  if (["CAT", "Quiz", "Assignment"].includes(base)) {
    const max = base === "CAT" ? 2 : 3;
    if (componentCounts[base] >= max) {
      alert(`Only ${max} ${base}s allowed.`);
      selectElement.value = "";
      return;
    }
    componentCounts[base]++;
    const newName = `${base}-${componentCounts[base]}`;
    const opt = document.createElement("option");
    opt.value = newName;
    opt.text = newName;
    opt.selected = true;
    selectElement.appendChild(opt);
    selectElement.value = newName;
  }
}

function addCutoff() {
  const grades = ["S", "A", "B", "C", "D", "E", "F"];
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="flex-row">
      <div>
        <select class="grade">
          ${grades.map(g => `<option value="${g}">${g}</option>`).join("")}
        </select>
      </div>
      <div><input type="number" placeholder="Min Score" class="cutoff" min="0" max="100"></div>
    </div>`;
  document.getElementById('cutoffs').appendChild(container);
}

function calculate() {
  const courseType = document.getElementById('courseType').value;
  const hasLab = courseType.includes('lab') || courseType.includes('project');
  const labRaw = parseFloat(document.getElementById('labMarks')?.value || 0);
  const labScore = hasLab ? (labRaw / 100) * 25 : 0;

  const compEls = document.getElementById('components').children;
  let internals = [], fatScore = 0, fatTotal = 100, fatWeightage = 0, internalWeightage = 0, rawFatWeightage = 0;

  for (let el of compEls) {
    const name = el.querySelector('.name')?.value?.trim();
    const obtained = parseFloat(el.querySelector('.obtained')?.value);
    const total = parseFloat(el.querySelector('.total')?.value);
    const weightage = parseFloat(el.querySelector('.weightage')?.value);
    if (!name || isNaN(obtained) || isNaN(total) || isNaN(weightage)) continue;

    if (name === "FAT") {
      fatScore = obtained;
      fatTotal = total;
      fatWeightage = weightage;
      rawFatWeightage = weightage;
    } else {
      internalWeightage += weightage;
      internals.push({ name, obtained, total, weightage });
    }
  }

  if (internalWeightage + fatWeightage !== 100) {
    document.getElementById('output').innerHTML = `<b>❌ Total weightage must be 100%.</b><br>Currently: ${internalWeightage + fatWeightage}%`;
    return;
  }

  const internalScore = internals.reduce((sum, c) => sum + (c.obtained / c.total) * c.weightage, 0);
  const theoryScore = internalScore + (fatScore / fatTotal) * fatWeightage;

  // Cutoffs
  const cutoffEls = document.getElementById('cutoffs').children;
  let cutoffs = {};
  for (let el of cutoffEls) {
    const grade = el.querySelector('.grade')?.value?.trim().toUpperCase();
    const score = parseFloat(el.querySelector('.cutoff')?.value);
    if (grade && !isNaN(score)) cutoffs[grade] = score;
  }

  const sortedCutoffs = Object.entries(cutoffs).sort((a, b) => b[1] - a[1]);

  let totalScore = hasLab ? (theoryScore * 0.75 + labScore) : theoryScore;
  let currentGrade = "F";

  for (let [grade, min] of sortedCutoffs) {
    if (totalScore >= min) {
      currentGrade = grade;
      break;
    }
  }

  let upgrades = [], passedCurrent = false;
  for (let [grade, cutoff] of sortedCutoffs) {
    if (grade === currentGrade) {
      passedCurrent = true;
      continue;
    }
    if (!passedCurrent) {
      let delta = cutoff - 0.99 - totalScore;
      let requiredFat = fatScore + (delta / (fatWeightage * (hasLab ? 0.75 : 1))) * fatTotal;
      upgrades.push({
        grade,
        extraScore: delta.toFixed(2),
        extraFat: (requiredFat - fatScore).toFixed(2),
        finalFat: requiredFat.toFixed(2)
      });
    }
  }

  // Output tables
  let theoryTable = `<h3>📘 Theory Components (Raw Score)</h3><table>
  <tr><th>Component</th><th>Obtained</th><th>Total</th><th>Weightage</th><th>Score</th></tr>`;

  internals.forEach(c => {
    const score = ((c.obtained / c.total) * c.weightage).toFixed(2);
    theoryTable += `<tr><td>${c.name}</td><td>${c.obtained}</td><td>${c.total}</td><td>${c.weightage}%</td><td>${score}</td></tr>`;
  });

  const fatDisplayScore = ((fatScore / fatTotal) * rawFatWeightage).toFixed(2);
  theoryTable += `<tr><td>FAT</td><td>${fatScore}</td><td>100</td><td>${rawFatWeightage}%</td><td>${fatDisplayScore}</td></tr>`;
  theoryTable += `<tr><th colspan="4">Theory Raw Score</th><th>${theoryScore.toFixed(2)}</th></tr></table>`;

  let combinedTable = "";
  if (hasLab) {
    combinedTable += `<h3>⚖️ Weighted Score Summary</h3><table>
    <tr><th>Component</th><th>Weightage</th><th>Original Score</th><th>Final Score</th></tr>
    <tr><td>Theory</td><td>75%</td><td>${theoryScore.toFixed(2)}</td><td>${(theoryScore * 0.75).toFixed(2)}</td></tr>
    <tr><td>Lab/Project</td><td>25%</td><td>${(labRaw).toFixed(2)}</td><td>${labScore.toFixed(2)}</td></tr>
    <tr><th colspan="3">Total Weighted Score</th><th>${totalScore.toFixed(2)}</th></tr></table>`;
  } else {
    combinedTable += `<p><b>Total Score (Theory Only):</b> ${totalScore.toFixed(2)}</p>`;
  }

  let gradeSummary = `<h3>🎯 Final Grade: ${currentGrade}</h3>`;
  if (upgrades.length > 0) {
    gradeSummary += `<h4>🔺 Possible Grade Improvements:</h4>`;
    upgrades.forEach(u => {
      if (u.finalFat > 100) {
        gradeSummary += `<p>➡ ${currentGrade} → ${u.grade}: ❌ Not possible (need ${u.finalFat} FAT marks)</p>`;
      } else {
        gradeSummary += `<p>➡ ${currentGrade} → ${u.grade}:<br>• Need +${u.extraScore} in total score<br>• Need +${u.extraFat} FAT marks<br>• Final FAT should be at least ${u.finalFat}</p>`;
      }
    });
  } else {
    gradeSummary += `<p>🎉 You're already at the highest grade!</p>`;
  }

  const finalHTML = theoryTable + combinedTable + gradeSummary;
  document.getElementById('output').innerHTML = finalHTML;
  localStorage.setItem("lastGradeResult", finalHTML);
}

window.onload = () => {
  document.getElementById("output").innerHTML = "";
  localStorage.removeItem("lastGradeResult");
};
