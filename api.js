/**
 * Frontend JS for:
 *  - Login / Register
 *  - Dashboard AI recommendations (View details + Apply)
 *  - Admin job management
 *  - External API jobs (Remotive)
 */

const hostname = window.location.hostname;
const API_BASE = window.location.origin.replace(/\/$/, "") + "/api";

function getToken() {
  return localStorage.getItem("token");
}

// For storing last loaded recommendations (for modal)
window._jobRecommendations = [];

// ------- Basic UI test logs -------
function runBasicUITests() {
  const tests = [];
  tests.push({ name: "Login form present", pass: !!document.getElementById("loginForm") });
  tests.push({ name: "Register form present", pass: !!document.getElementById("registerForm") });
  tests.push({ name: "Recommendations container", pass: !!document.getElementById("recommendations") });
  tests.push({ name: "Logout button", pass: !!document.getElementById("logoutBtn") });
  tests.push({ name: "Admin create job form", pass: !!document.getElementById("createJobForm") });

  console.group("[JobPortal] Basic UI Tests");
  tests.forEach((t) => console[t.pass ? "log" : "error"](`${t.pass ? "✔" : "✘"} ${t.name}`));
  console.groupEnd();
}

document.addEventListener("DOMContentLoaded", () => {
  runBasicUITests();

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const authMessage = document.getElementById("authMessage");
  const recommendationsDiv = document.getElementById("recommendations");
  const dashboardMessage = document.getElementById("dashboardMessage");
  const logoutBtn = document.getElementById("logoutBtn");

  // external jobs elements
  const externalJobsDiv = document.getElementById("externalJobs");
  const externalJobsMessage = document.getElementById("externalJobsMessage");
  const externalJobsSearchInput = document.getElementById("externalJobsSearch");
  const externalJobsSearchBtn = document.getElementById("externalJobsSearchBtn");

  const jobDetailsModalEl = document.getElementById("jobDetailsModal");
  const jobDetailsModal = jobDetailsModalEl
    ? new bootstrap.Modal(jobDetailsModalEl)
    : null;
  const jobModalApplyBtn = document.getElementById("jobModalApplyBtn");

  const createJobForm = document.getElementById("createJobForm");
  const adminMessage = document.getElementById("adminMessage");
  const jobsList = document.getElementById("jobsList");
  const refreshJobsBtn = document.getElementById("refreshJobsBtn");

  // -------- LOGIN --------
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (authMessage) {
        authMessage.textContent = "";
        authMessage.classList.remove("text-success");
        authMessage.classList.add("text-danger");
      }

      const formData = new FormData(loginForm);
      const body = {
        email: formData.get("email"),
        password: formData.get("password"),
      };

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();

        if (!res.ok) {
          if (authMessage) authMessage.textContent = data.message || "Login failed";
          return;
        }

        localStorage.setItem("token", data.token);
        window.location.href = "dashboard.html";
      } catch (err) {
        console.error(err);
        if (authMessage) {
          authMessage.textContent =
            "Network error: backend not reachable. Is Node server running?";
        }
      }
    });
  }

  // -------- REGISTER --------
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (authMessage) {
        authMessage.textContent = "";
        authMessage.classList.remove("text-success");
        authMessage.classList.add("text-danger");
      }

      const formData = new FormData(registerForm);
      const body = {
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
        skills: formData.get("skills"),
        preferredLocation: formData.get("preferredLocation"),
        preferredJobType: formData.get("preferredJobType"),
        experienceLevel: formData.get("experienceLevel"),
      };

      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();

        if (!res.ok) {
          if (authMessage) authMessage.textContent = data.message || "Registration failed";
          return;
        }

        if (authMessage) {
          authMessage.classList.remove("text-danger");
          authMessage.classList.add("text-success");
          authMessage.textContent = "Registered successfully. You can now login.";
        }
        registerForm.reset();
      } catch (err) {
        console.error(err);
        if (authMessage) {
          authMessage.textContent =
            "Network error: backend not reachable. Is Node server running?";
        }
      }
    });
  }

  // -------- DASHBOARD: LOAD RECOMMENDATIONS --------
  if (recommendationsDiv) {
    (async () => {
      const token = getToken();
      if (!token) {
        window.location.href = "index.html";
        return;
      }

      if (dashboardMessage) {
        dashboardMessage.textContent = "Loading recommendations...";
        dashboardMessage.classList.remove("text-danger");
        dashboardMessage.classList.add("text-muted");
      }

      try {
        const res = await fetch(`${API_BASE}/recommend`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
          if (dashboardMessage) {
            dashboardMessage.classList.remove("text-muted");
            dashboardMessage.classList.add("text-danger");
            dashboardMessage.textContent =
              data.message || "Failed to load recommendations";
          }
          return;
        }

        const recs = data.recommendations || [];
        window._jobRecommendations = recs;

        if (!recs.length) {
          recommendationsDiv.innerHTML =
            "<p>No jobs found. Ask admin to add jobs.</p>";
          if (dashboardMessage) dashboardMessage.textContent = "";
          return;
        }

        recommendationsDiv.innerHTML = "";
        if (dashboardMessage) dashboardMessage.textContent = "";

        recs.forEach((item, index) => {
          const job = item.job || {};
          const explanation = item.explanation || {};
          const rawScore = typeof item.score === "number" ? item.score : 0;
          const scoreDisplay =
            typeof item.score === "number"
              ? (rawScore * 100).toFixed(1) + "%"
              : "N/A";

          const matchedSkills =
            (explanation.matchedSkills || []).join(", ") || "None";
          const locationMatch = explanation.locationMatch ? "Yes" : "No";
          const jobTypeMatch = explanation.jobTypeMatch ? "Yes" : "No";

          const jobId = job._id || job.id || String(index);

          const card = document.createElement("div");
          card.className = "col-md-6";
          card.innerHTML = `
            <div class="card shadow-sm h-100">
              <div class="card-body">
                <h5 class="card-title">${job.title || "Untitled role"}</h5>
                <h6 class="card-subtitle mb-2 text-muted">${
                  job.company || "Unknown company"
                }</h6>
                <p class="mb-1"><strong>Location:</strong> ${
                  job.location || "N/A"
                }</p>
                <p class="mb-1"><strong>Type:</strong> ${
                  job.jobType || "N/A"
                }</p>
                <p class="mb-1"><strong>Experience:</strong> ${
                  job.experienceLevel || "N/A"
                }</p>
                <p class="mb-1"><strong>Skills:</strong> ${
                  (job.requiredSkills || []).join(", ") || "N/A"
                }</p>
                <p class="mb-2"><strong>AI Score:</strong> ${scoreDisplay}</p>
                <div class="d-flex gap-2 mt-2">
                  <button class="btn btn-sm auth-btn-secondary btn-view" data-job-id="${jobId}">
                    <i class="bi bi-eye me-1"></i>Details
                  </button>
                  <button class="btn btn-sm auth-btn-primary btn-apply" data-job-id="${jobId}">
                    <i class="bi bi-send me-1"></i>Apply
                  </button>
                </div>
              </div>
            </div>
          `;
          recommendationsDiv.appendChild(card);
        });
      } catch (err) {
        console.error(err);
        if (dashboardMessage) {
          dashboardMessage.classList.remove("text-muted");
          dashboardMessage.classList.add("text-danger");
          dashboardMessage.textContent =
            "Network error: backend not reachable. Is Node server running?";
        }
      }
    })();
  }

  // -------- DASHBOARD: CARD BUTTON HANDLERS (event delegation) --------
  if (recommendationsDiv) {
    recommendationsDiv.addEventListener("click", async (e) => {
      const target = e.target.closest("button");
      if (!target) return;

      const jobId = target.getAttribute("data-job-id");
      if (!jobId) return;

      // find job item from cached recommendations
      const item =
        window._jobRecommendations.find((x, idx) => {
          const id = x.job._id || x.job.id || String(idx);
          return String(id) === String(jobId);
        }) || null;

      if (!item) return;

      const job = item.job || {};
      const expl = item.explanation || {};
      const rawScore = typeof item.score === "number" ? item.score : 0;
      const scoreDisplay =
        typeof item.score === "number"
          ? (rawScore * 100).toFixed(1) + "%"
          : "N/A";

      if (target.classList.contains("btn-view") && jobDetailsModal) {
        // Fill modal
        document.getElementById("jobModalTitle").textContent =
          job.title || "Untitled role";
        document.getElementById("jobModalCompany").textContent =
          job.company || "Unknown company";
        document.getElementById("jobModalLocation").textContent =
          job.location || "N/A";
        document.getElementById("jobModalType").textContent =
          job.jobType || "N/A";
        document.getElementById("jobModalExp").textContent =
          job.experienceLevel || "N/A";
        document.getElementById("jobModalScore").textContent = scoreDisplay;

        document.getElementById("jobModalMatchedSkills").textContent =
          (expl.matchedSkills || []).join(", ") || "None";
        document.getElementById("jobModalLocMatch").textContent =
          expl.locationMatch ? "Yes" : "No";
        document.getElementById("jobModalTypeMatch").textContent =
          expl.jobTypeMatch ? "Yes" : "No";
        document.getElementById("jobModalExpMatch").textContent =
          expl.experienceMatch ? "Yes" : "No";

        const tagsContainer = document.getElementById("jobModalSkillsTags");
        tagsContainer.innerHTML = "";
        (job.requiredSkills || []).forEach((s) => {
          const span = document.createElement("span");
          span.className = "job-skill-tag";
          span.textContent = s;
          tagsContainer.appendChild(span);
        });

        // store jobId on modal apply button
        if (jobModalApplyBtn) {
          jobModalApplyBtn.setAttribute("data-job-id", jobId);
        }

        jobDetailsModal.show();
      }

      if (target.classList.contains("btn-apply")) {
        await applyToJob(jobId, job, dashboardMessage);
      }
    });
  }

  // Apply from inside modal
  if (jobModalApplyBtn) {
    jobModalApplyBtn.addEventListener("click", async () => {
      const jobId = jobModalApplyBtn.getAttribute("data-job-id");
      if (!jobId) return;
      if (dashboardMessage) {
        dashboardMessage.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      await applyToJob(jobId, null, dashboardMessage);
    });
  }

  async function applyToJob(jobId, job, messageEl) {
    const token = getToken();
    if (!token) {
      window.location.href = "index.html";
      return;
    }
    if (messageEl) {
      messageEl.classList.remove("text-danger");
      messageEl.classList.add("text-muted");
      messageEl.textContent = "Submitting application...";
    }

    try {
      const res = await fetch(`${API_BASE}/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (messageEl) {
          messageEl.classList.remove("text-muted");
          messageEl.classList.add("text-danger");
          messageEl.textContent = data.message || "Failed to apply";
        }
        return;
      }

      if (messageEl) {
        messageEl.classList.remove("text-danger");
        messageEl.classList.add("text-success");
        messageEl.textContent = data.message || "Application submitted successfully.";
      }
    } catch (err) {
      console.error(err);
      if (messageEl) {
        messageEl.classList.remove("text-muted");
        messageEl.classList.add("text-danger");
        messageEl.textContent =
          "Network error while submitting application. Please try again.";
      }
    }
  }

  // -------- EXTERNAL JOBS (API via /api/external-jobs) --------
  async function loadExternalJobs(searchTerm = "") {
    if (!externalJobsDiv) return;

    const token = getToken();
    if (!token) {
      window.location.href = "index.html";
      return;
    }

    externalJobsDiv.innerHTML = "";
    if (externalJobsMessage) {
      externalJobsMessage.classList.remove("text-danger");
      externalJobsMessage.classList.add("text-muted");
      externalJobsMessage.textContent = "Loading live remote jobs from API...";
    }

    const params = new URLSearchParams();
    if (searchTerm) params.append("search", searchTerm);

    let url = `${API_BASE}/external-jobs`;
    if ([...params].length) {
      url += "?" + params.toString();
    }

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        if (externalJobsMessage) {
          externalJobsMessage.classList.remove("text-muted");
          externalJobsMessage.classList.add("text-danger");
          externalJobsMessage.textContent =
            data.message || "Failed to load external jobs.";
        }
        return;
      }

      const jobs = data.jobs || [];
      if (!jobs.length) {
        externalJobsDiv.innerHTML =
          "<p class='small text-muted'>No jobs found for this query.</p>";
        if (externalJobsMessage) externalJobsMessage.textContent = "";
        return;
      }

      if (externalJobsMessage) externalJobsMessage.textContent = "";

      jobs.forEach((job) => {
        const col = document.createElement("div");
        col.className = "col-md-6 col-lg-4";

        col.innerHTML = `
          <div class="card h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-1">
                <div>
                  <h6 class="mb-0">${job.title || "Untitled role"}</h6>
                  <small class="text-muted">${job.company || "Unknown company"}</small>
                </div>
                <span class="badge bg-secondary bg-opacity-75">
                  ${job.jobType || "Remote"}
                </span>
              </div>
              <p class="mb-1 small">
                <strong>Location:</strong> ${job.candidateLocation || "Remote"}
              </p>
              ${
                job.salary
                  ? `<p class="mb-1 small"><strong>Salary:</strong> ${job.salary}</p>`
                  : ""
              }
              <p class="mb-2 small">${job.descriptionSnippet || ""}</p>
              <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">
                  ${job.category || "General"} • ${
          job.publicationDate
            ? new Date(job.publicationDate).toLocaleDateString()
            : ""
        }
                </small>
                <a href="${job.url}" target="_blank" rel="noopener noreferrer" class="external-job-link">
                  View on Remotive
                </a>
              </div>
            </div>
          </div>
        `;

        externalJobsDiv.appendChild(col);
      });
    } catch (err) {
      console.error(err);
      if (externalJobsMessage) {
        externalJobsMessage.classList.remove("text-muted");
        externalJobsMessage.classList.add("text-danger");
        externalJobsMessage.textContent =
          "Network error while loading external jobs. Please try again.";
      }
    }
  }

  // Initial load + search events
  if (externalJobsDiv) {
    loadExternalJobs(); // first load without search

    if (externalJobsSearchBtn && externalJobsSearchInput) {
      externalJobsSearchBtn.addEventListener("click", () => {
        const term = externalJobsSearchInput.value.trim();
        loadExternalJobs(term);
      });

      externalJobsSearchInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
          const term = externalJobsSearchInput.value.trim();
          loadExternalJobs(term);
        }
      });
    }
  }

  // -------- ADMIN: Create job + list jobs --------
  if (createJobForm && jobsList) {
    // load jobs
    async function loadJobs() {
      const token = getToken();
      if (!token) {
        window.location.href = "index.html";
        return;
      }
      jobsList.innerHTML = "<p>Loading jobs...</p>";
      try {
        const res = await fetch(`${API_BASE}/jobs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          jobsList.innerHTML =
            "<p class='text-danger small'>Failed to load jobs.</p>";
          return;
        }
        const jobs = data.jobs || [];
        if (!jobs.length) {
          jobsList.innerHTML =
            "<p class='text-muted small'>No jobs found. Create a new job using the form.</p>";
          return;
        }

        jobsList.innerHTML = "";
        jobs.forEach((job) => {
          const badge = job.isActive
            ? `<span class="badge bg-success bg-opacity-75 ms-2">Active</span>`
            : `<span class="badge bg-secondary bg-opacity-75 ms-2">Inactive</span>`;
          const div = document.createElement("div");
          div.className =
            "border-bottom border-slate-700/40 py-2 d-flex justify-content-between align-items-start";
          div.innerHTML = `
            <div>
              <strong>${job.title}</strong> @ ${job.company} ${badge}<br/>
              <small class="text-muted">
                ${job.location || "N/A"} &middot; ${job.jobType || "N/A"} &middot; ${
            job.experienceLevel || "N/A"
          }
              </small><br/>
              <small>Skills: ${(job.requiredSkills || []).join(", ") || "N/A"}</small>
            </div>
          `;
          jobsList.appendChild(div);
        });
      } catch (err) {
        console.error(err);
        jobsList.innerHTML =
          "<p class='text-danger small'>Network error while loading jobs.</p>";
      }
    }

    loadJobs();

    if (refreshJobsBtn) {
      refreshJobsBtn.addEventListener("click", loadJobs);
    }

    createJobForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const token = getToken();
      if (!token) {
        window.location.href = "index.html";
        return;
      }
      if (adminMessage) {
        adminMessage.textContent = "";
        adminMessage.classList.remove("text-success");
        adminMessage.classList.add("text-danger");
      }

      const formData = new FormData(createJobForm);
      const body = {
        title: formData.get("title"),
        company: formData.get("company"),
        location: formData.get("location"),
        jobType: formData.get("jobType"),
        experienceLevel: formData.get("experienceLevel"),
        requiredSkills: String(formData.get("requiredSkills") || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        isActive: formData.get("isActive") === "on",
      };

      try {
        const res = await fetch(`${API_BASE}/jobs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        const data = await res.json();

        if (!res.ok) {
          if (adminMessage) adminMessage.textContent = data.message || "Failed to create job.";
          return;
        }

        if (adminMessage) {
          adminMessage.classList.remove("text-danger");
          adminMessage.classList.add("text-success");
          adminMessage.textContent = "Job created successfully.";
        }
        createJobForm.reset();
        loadJobs();
      } catch (err) {
        console.error(err);
        if (adminMessage) {
          adminMessage.textContent =
            "Network error while creating job. Please try again.";
        }
      }
    });
  }

  // -------- LOGOUT (shared) --------
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "index.html";
    });
  }
});
