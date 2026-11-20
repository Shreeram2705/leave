const API_URL = "/api/leaves";

const form = document.getElementById("leaveForm");

const table = document.getElementById("leaveTable");

const message = document.getElementById("message");


// Submit Leave Application

form.addEventListener("submit", async function(event) {

    event.preventDefault();

    const leaveData = {

        employeeName: document.getElementById("employeeName").value,

        leaveType: document.getElementById("leaveType").value,

        startDate: document.getElementById("startDate").value,

        endDate: document.getElementById("endDate").value,

        reason: document.getElementById("reason").value

    };

    try {

        const response = await axios.post(API_URL, leaveData);

        message.textContent = response.data.message;

        message.style.color = "green";

        form.reset();

        loadLeaves();

    }

    catch(error) {

        message.textContent =
            error.response?.data?.message || "Error submitting leave";

        message.style.color = "red";

    }

});


// Load Leave Requests

async function loadLeaves() {

    try {

        const response = await axios.get(API_URL);

        displayLeaves(response.data);

    }

    catch(error) {

        console.error("Error loading leaves:", error);

        table.innerHTML = `
            <tr>
                <td colspan="7">Unable to load leave requests</td>
            </tr>
        `;

    }

}


// Display Leave Requests

function displayLeaves(leaves) {

    table.innerHTML = "";

    if (leaves.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="7">No leave requests available</td>
            </tr>
        `;

        return;

    }

    leaves.forEach(leave => {

        const row = document.createElement("tr");

        const employee = document.createElement("td");
        employee.textContent = leave.employeeName;

        const type = document.createElement("td");
        type.textContent = leave.leaveType;

        const start = document.createElement("td");
        start.textContent = formatDate(leave.startDate);

        const end = document.createElement("td");
        end.textContent = formatDate(leave.endDate);

        const reason = document.createElement("td");
        reason.textContent = leave.reason;

        const statusCell = document.createElement("td");

        const statusBadge = document.createElement("span");
        statusBadge.className = `status ${leave.status}`;
        statusBadge.textContent = leave.status;

        statusCell.appendChild(statusBadge);

        const actionCell = document.createElement("td");

        if (leave.status === "Pending") {

            const approveButton = document.createElement("button");

            approveButton.textContent = "Approve";
            approveButton.className = "approve-btn";

            approveButton.addEventListener("click", () => {
                updateLeave(leave._id, "Approved");
            });


            const rejectButton = document.createElement("button");

            rejectButton.textContent = "Reject";
            rejectButton.className = "reject-btn";

            rejectButton.addEventListener("click", () => {
                updateLeave(leave._id, "Rejected");
            });

            actionCell.appendChild(approveButton);
            actionCell.appendChild(rejectButton);

        } else {

            actionCell.textContent = "No actions";

        }

        row.appendChild(employee);
        row.appendChild(type);
        row.appendChild(start);
        row.appendChild(end);
        row.appendChild(reason);
        row.appendChild(statusCell);
        row.appendChild(actionCell);

        table.appendChild(row);

    });

}


// Format Date

function formatDate(date) {

    return new Date(date).toLocaleDateString("en-IN");

}


// Approve or Reject Leave

async function updateLeave(id, status) {

    try {

        const response = await axios.patch(
            `${API_URL}/${id}`,
            { status: status }
        );

        alert(response.data.message);

        loadLeaves();

    }

    catch(error) {

        alert(
            error.response?.data?.message || "Error updating leave"
        );

    }

}


// Load data when page opens

loadLeaves();
