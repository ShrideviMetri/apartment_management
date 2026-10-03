// ================= AUTH CHECK =================

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}


const API = "http://localhost:5000/api";

// ===============================
// SHOW SECTION
// ===============================

function showSection(sectionId) {
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active");
  });

  document.getElementById(sectionId).classList.add("active");
}

// ===============================
// DASHBOARD COUNTS
// ===============================

async function loadDashboardCounts() {
  try {
    const apartments = await fetch(`${API}/apartment`).then((res) =>
      res.json(),
    );
    const residents = await fetch(`${API}/resident`).then((res) => res.json());
    const complaints = await fetch(`${API}/complaint`).then((res) =>
      res.json(),
    );
    const staff = await fetch(`${API}/staff`).then((res) => res.json());
    const bills = await fetch(`${API}/maintenancebill`).then((res) =>
      res.json(),
    );
    const parking = await fetch(`${API}/parkingslot`).then((res) => res.json());
    const gymMemberships = await fetch(`${API}/gymmembership`).then((res) =>
      res.json(),
    );
    const amenities = await fetch(`${API}/amenity`).then((res) => res.json());

    document.getElementById("apartmentCount").textContent = apartments.length;
    document.getElementById("residentCount").textContent = residents.length;
    document.getElementById("complaintCount").textContent = complaints.length;
    document.getElementById("staffCount").textContent = staff.length;

    document.getElementById("billCount").textContent = bills.length;
    const pendingBills = bills.filter(
      (bill) => bill.status.toLowerCase() === "pending",
    );

    document.getElementById("pendingBillCount").textContent =
      pendingBills.length;
    document.getElementById("parkingCount").textContent = parking.length;
    document.getElementById("gymCount").textContent = gymMemberships.length;
    document.getElementById("amenityCount").textContent = amenities.length;
  } catch (error) {
    console.error("Error loading dashboard:", error);
  }
}

//recent complaints
//=================================================================================================

async function loadRecentComplaints() {
  try {
    const complaints = await fetch(`${API}/complaint`).then((res) =>
      res.json(),
    );

    const tbody = document.getElementById("recentComplaintsBody");

    tbody.innerHTML = "";

    // Show latest 5 complaints
    const recentComplaints = complaints
      .filter((complaint) => complaint.status !== "Solved")
      .slice(-5)
      .reverse();

    recentComplaints.forEach((complaint) => {
      const row = document.createElement("tr");

      row.innerHTML = `
                <td>${complaint.complaint_id}</td>
                <td>${complaint.category}</td>
                <td>${complaint.priority}</td>
                <td>
    <span class="status-badge status-${complaint.status.toLowerCase().replace(" ", "-")}">
        ${complaint.status}
    </span>
</td>
            `;

      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading recent complaints:", error);
  }
}

// ===============================
// APARTMENTS
// ===============================
async function loadApartments() {
  try {
    const response = await fetch(`${API}/apartment`);
    const data = await response.json();

    const tableBody = document.getElementById("apartmentTableBody");

    tableBody.innerHTML = "";

    data.forEach((apartment) => {
      const row = document.createElement("tr");

      row.innerHTML = `
                <td>${apartment.apartment_id}</td>
                <td>${apartment.apartment_number}</td>
                <td>${apartment.floor}</td>
                <td>${apartment.wing || "-"}</td>
                <td>${apartment.type || "-"}</td>
                <td>${apartment.area_sqft || "-"}</td>
                <span class="status-badge ${apartment.status.toLowerCase()}">
    ${apartment.status}
</span>
                <td>
                
    <button onclick="editApartment(${apartment.apartment_id})">
        Edit
    </button>

    <button onclick="deleteApartment(${apartment.apartment_id})">
        Delete
    </button>
               
                </td>
            `;

      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading apartments:", error);
  }
}

function showApartmentForm() {
  document.getElementById("apartmentForm").style.display = "block";
}

function hideApartmentForm() {
  document.getElementById("apartmentForm").style.display = "none";
}

async function addApartment() {
  const apartment = {
    apartment_number: document.getElementById("apartment_number").value,
    floor: document.getElementById("floor").value,
    wing: document.getElementById("wing").value,
    type: document.getElementById("type").value,
    area_sqft: document.getElementById("area_sqft").value,
    status: document.getElementById("status").value,
  };

  try {
    const response = await fetch(`${API}/apartment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apartment),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to add apartment");
      return;
    }

    alert("Apartment added successfully!");

    hideApartmentForm();

    loadApartments();

    loadDashboardCounts();
  } catch (error) {
    console.error("Error adding apartment:", error);
    alert("Something went wrong");
  }
}

async function deleteApartment(id) {
  if (!confirm("Are you sure you want to delete this apartment?")) {
    return;
  }

  try {
    const response = await fetch(`${API}/apartment/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to delete apartment");
      return;
    }

    alert("Apartment deleted successfully!");

    loadApartments();

    loadDashboardCounts();
  } catch (error) {
    console.error("Error deleting apartment:", error);
  }
}

async function editApartment(id) {
  const apartmentNumber = prompt("Apartment Number:");
  if (apartmentNumber === null) return;

  const floor = prompt("Floor:");
  if (floor === null) return;

  const wing = prompt("Wing:");
  if (wing === null) return;

  const type = prompt("Type:");
  if (type === null) return;

  const area = prompt("Area (sqft):");
  if (area === null) return;

  const status = prompt("Status (Occupied/Vacant):");
  if (status === null) return;

  const apartment = {
    apartment_number: apartmentNumber,
    floor: floor,
    wing: wing,
    type: type,
    area_sqft: area,
    status: status,
  };

  try {
    const response = await fetch(`${API}/apartment/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apartment),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to update apartment");
      return;
    }

    alert("Apartment updated successfully!");

    loadApartments();
    loadDashboardCounts();
  } catch (error) {
    console.error("Error updating apartment:", error);
    alert("Something went wrong");
  }
}

// ===============================
// RESIDENTS
// ===============================

async function loadResidents() {
  try {
    const response = await fetch(`${API}/resident`);
    const data = await response.json();

    const tableBody = document.getElementById("residentTableBody");

    tableBody.innerHTML = "";

    data.forEach((resident) => {
      const row = document.createElement("tr");

      row.innerHTML = `
                <td>${resident.resident_id}</td>
                <td>${resident.apartment_id}</td>
                <td>${resident.name}</td>
                <td>${resident.phone || "-"}</td>
                <td>${resident.email || "-"}</td>
                <td>${resident.occupation || "-"}</td>
                <td>${resident.role || "-"}</td>
                <td>${resident.move_in_date ? new Date(resident.move_in_date).toLocaleDateString("en-IN") : "-"}</td>
<td>${resident.move_out_date ? new Date(resident.move_out_date).toLocaleDateString("en-IN") : "-"}</td>

                <td>
                    <button onclick="editResident(${resident.resident_id})">
                        Edit
                    </button>

                    <button onclick="deleteResident(${resident.resident_id})">
                        Delete
                    </button>
                </td>
            `;

      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading residents:", error);
  }
}

function showResidentForm() {
  document.getElementById("residentForm").style.display = "block";
}

function hideResidentForm() {
  document.getElementById("residentForm").style.display = "none";
}

async function addResident() {
  const resident = {
    apartment_id: document.getElementById("resident_apartment_id").value,

    name: document.getElementById("resident_name").value,

    phone: document.getElementById("resident_phone").value,

    email: document.getElementById("resident_email").value,

    occupation: document.getElementById("resident_occupation").value,

    role: document.getElementById("resident_role").value,

    move_in_date:
      document.getElementById("resident_move_in_date").value || null,

    move_out_date:
      document.getElementById("resident_move_out_date").value || null,
  };

  try {
    const response = await fetch(`${API}/resident`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(resident),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to add resident");
      return;
    }

    alert("Resident added successfully!");

    hideResidentForm();

    loadResidents();

    loadDashboardCounts();
  } catch (error) {
    console.error("Error adding resident:", error);

    alert("Something went wrong");
  }
}

async function deleteResident(id) {
  if (!confirm("Are you sure you want to delete this resident?")) {
    return;
  }

  try {
    const response = await fetch(`${API}/resident/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to delete resident");
      return;
    }

    alert("Resident deleted successfully!");

    loadResidents();

    loadDashboardCounts();
  } catch (error) {
    console.error("Error deleting resident:", error);
  }
}

async function editResident(id) {
  const apartmentId = prompt("Apartment ID:");
  if (apartmentId === null) return;

  const name = prompt("Name:");
  if (name === null) return;

  const phone = prompt("Phone:");
  if (phone === null) return;

  const email = prompt("Email:");
  if (email === null) return;

  const occupation = prompt("Occupation:");
  if (occupation === null) return;

  const role = prompt("Role:");
  if (role === null) return;

  const moveInDate = prompt("Move-in Date (YYYY-MM-DD):");
  if (moveInDate === null) return;

  const moveOutDate = prompt("Move-out Date (YYYY-MM-DD or leave blank):");
  if (moveOutDate === null) return;

  const resident = {
    apartment_id: apartmentId,
    name: name,
    phone: phone,
    email: email,
    occupation: occupation,
    role: role,
    move_in_date: moveInDate || null,
    move_out_date: moveOutDate || null,
  };

  try {
    const response = await fetch(`${API}/resident/${id}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(resident),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to update resident");
      return;
    }

    alert("Resident updated successfully!");

    loadResidents();

    loadDashboardCounts();
  } catch (error) {
    console.error("Error updating resident:", error);

    alert("Something went wrong");
  }
}

// ================= FAMILY MEMBERS =================

async function loadFamilyMembers() {
  try {
    const response = await fetch(`${API}/familymember`);
    const data = await response.json();

    const tableBody = document.getElementById("familyTableBody");

    tableBody.innerHTML = "";

    data.forEach((member) => {
      tableBody.innerHTML += `
                <tr>
                    <td>${member.family_member_id}</td>
                    <td>${member.resident_id}</td>
                    <td>${member.relationship}</td>
                    <td>${member.age}</td>
                    <td>${member.phone || ""}</td>
                    <td>
                        <button onclick="editFamilyMember(${member.family_member_id})">
                            Edit
                        </button>

                        <button onclick="deleteFamilyMember(${member.family_member_id})">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
    });
  } catch (error) {
    console.error("Error loading family members:", error);
  }
}

function showFamilyForm() {
  document.getElementById("familyForm").style.display = "block";
}

function hideFamilyForm() {
  document.getElementById("familyForm").style.display = "none";
}

async function addFamilyMember() {
  const resident_id = document.getElementById("family_resident_id").value;

  const relationship = document.getElementById("family_relationship").value;

  const age = document.getElementById("family_age").value;

  const phone = document.getElementById("family_phone").value;

  try {
    const response = await fetch(`${API}/familymember`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        resident_id,
        relationship,
        age,
        phone,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to add family member");
      return;
    }

    alert("Family member added successfully!");

    hideFamilyForm();

    loadFamilyMembers();
  } catch (error) {
    console.error("Error adding family member:", error);
  }
}

async function deleteFamilyMember(id) {
  if (!confirm("Are you sure you want to delete this family member?")) {
    return;
  }

  try {
    const response = await fetch(`${API}/familymember/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to delete family member");
      return;
    }

    alert("Family member deleted successfully!");

    loadFamilyMembers();
  } catch (error) {
    console.error("Error deleting family member:", error);
  }
}

async function editFamilyMember(id) {
  const relationship = prompt("Enter relationship:");

  if (relationship === null) return;

  const age = prompt("Enter age:");

  if (age === null) return;

  const phone = prompt("Enter phone:");

  if (phone === null) return;

  try {
    const response = await fetch(`${API}/familymember/${id}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        relationship,
        age,
        phone,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to update family member");
      return;
    }

    alert("Family member updated successfully!");

    loadFamilyMembers();
  } catch (error) {
    console.error("Error updating family member:", error);
  }
}



// ===============================
// PARKING
// ===============================

// ================= PARKING SLOTS =================

async function loadParking() {
  try {
    const response = await fetch(`${API}/parkingslot`);
    const data = await response.json();

    const tableBody = document.getElementById("parkingTableBody");

    tableBody.innerHTML = "";

    data.forEach((slot) => {
      tableBody.innerHTML += `
        <tr>
          <td>${slot.parking_slot_id}</td>
          <td>${slot.slot_number}</td>
          <td>${slot.type || "-"}</td>
          <td>
            <span class="status-badge status-${slot.status.toLowerCase()}">
              ${slot.status}
            </span>
          </td>
          <td>
            <button onclick="editParkingSlot(${slot.parking_slot_id})">
              Edit
            </button>

            <button onclick="deleteParkingSlot(${slot.parking_slot_id})">
              Delete
            </button>
          </td>
        </tr>
      `;
    });
  } catch (error) {
    console.error("Error loading parking slots:", error);
  }
}

function showParkingForm() {
  document.getElementById("parkingForm").style.display = "block";
}

function hideParkingForm() {
  document.getElementById("parkingForm").style.display = "none";
}

async function addParkingSlot() {
  const slot_number = document.getElementById("parking_slot_number").value;

  const type = document.getElementById("parking_type").value;

  const status = document.getElementById("parking_status").value;

  try {
    const response = await fetch(`${API}/parkingslot`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        slot_number,
        type,
        status,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to add parking slot");
      return;
    }

    alert("Parking slot added successfully!");

    hideParkingForm();

    loadParking();
  } catch (error) {
    console.error("Error adding parking slot:", error);
  }
}

async function deleteParkingSlot(id) {
  if (!confirm("Are you sure you want to delete this parking slot?")) {
    return;
  }

  try {
    const response = await fetch(`${API}/parkingslot/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to delete parking slot");
      return;
    }

    alert("Parking slot deleted successfully!");

    loadParking();
  } catch (error) {
    console.error("Error deleting parking slot:", error);
  }
}

async function editParkingSlot(id) {
  const slot_number = prompt("Enter slot number:");

  if (slot_number === null) return;

  const type = prompt("Enter type (Car / Bike):");

  if (type === null) return;

  const status = prompt("Enter status (Available / Occupied):");

  if (status === null) return;

  try {
    const response = await fetch(`${API}/parkingslot/${id}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        slot_number,
        type,
        status,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to update parking slot");
      return;
    }

    alert("Parking slot updated successfully!");

    loadParking();
  } catch (error) {
    console.error("Error updating parking slot:", error);
  }
}

//vehicles
//======================
// ================= VEHICLES =================

async function loadVehicles() {
  try {
    const response = await fetch(`${API}/vehicle`);
    const data = await response.json();

    const tableBody = document.getElementById("vehicleTableBody");
    tableBody.innerHTML = "";

    data.forEach((vehicle) => {
      tableBody.innerHTML += `
                <tr>
                    <td>${vehicle.vehicle_id}</td>
                    <td>${vehicle.resident_id}</td>
                    <td>${vehicle.parking_slot_id || ""}</td>
                    <td>${vehicle.vehicle_number}</td>
                    <td>${vehicle.vehicle_type || ""}</td>
                    <td>${vehicle.brand || ""}</td>
                    <td>${vehicle.model || ""}</td>
                    <td>
                        <button onclick="editVehicle(${vehicle.vehicle_id})">
                            Edit
                        </button>

                        <button onclick="deleteVehicle(${vehicle.vehicle_id})">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
    });
  } catch (error) {
    console.error("Error loading vehicles:", error);
  }
}

function showVehicleForm() {
  document.getElementById("vehicleForm").style.display = "block";
}

function hideVehicleForm() {
  document.getElementById("vehicleForm").style.display = "none";
}

async function addVehicle() {
  const resident_id = document.getElementById("vehicle_resident_id").value;

  const parking_slot_id =
    document.getElementById("vehicle_parking_slot_id").value || null;

  const vehicle_number = document.getElementById("vehicle_number").value;

  const vehicle_type = document.getElementById("vehicle_type").value;

  const brand = document.getElementById("vehicle_brand").value;

  const model = document.getElementById("vehicle_model").value;

  try {
    const response = await fetch(`${API}/vehicle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resident_id,
        parking_slot_id,
        vehicle_number,
        vehicle_type,
        brand,
        model,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to add vehicle");
      return;
    }

    alert("Vehicle added successfully!");

    hideVehicleForm();
    loadVehicles();
  } catch (error) {
    console.error("Error adding vehicle:", error);
  }
}

async function deleteVehicle(id) {
  if (!confirm("Are you sure you want to delete this vehicle?")) {
    return;
  }

  try {
    const response = await fetch(`${API}/vehicle/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to delete vehicle");
      return;
    }

    alert("Vehicle deleted successfully!");

    loadVehicles();
  } catch (error) {
    console.error("Error deleting vehicle:", error);
  }
}

async function editVehicle(id) {
  const resident_id = prompt("Enter resident ID:");

  if (resident_id === null) return;

  const parking_slot_id = prompt(
    "Enter parking slot ID (leave blank if none):",
  );

  if (parking_slot_id === null) return;

  const vehicle_number = prompt("Enter vehicle number:");

  if (vehicle_number === null) return;

  const vehicle_type = prompt("Enter vehicle type:");

  if (vehicle_type === null) return;

  const brand = prompt("Enter brand:");

  if (brand === null) return;

  const model = prompt("Enter model:");

  if (model === null) return;

  try {
    const response = await fetch(`${API}/vehicle/${id}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        resident_id,
        parking_slot_id: parking_slot_id || null,
        vehicle_number,
        vehicle_type,
        brand,
        model,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to update vehicle");
      return;
    }

    alert("Vehicle updated successfully!");

    loadVehicles();
  } catch (error) {
    console.error("Error updating vehicle:", error);
  }
}

// ================= MAINTENANCE BILLS =================

async function loadMaintenanceBills() {
  try {
    const response = await fetch(`${API}/maintenancebill`);
    const data = await response.json();

    const tableBody = document.getElementById("maintenanceBillTableBody");
    tableBody.innerHTML = "";

    data.forEach((bill) => {
      tableBody.innerHTML += `
                <tr>
                    <td>${bill.bill_id}</td>
                    <td>${bill.apartment_id}</td>
                    <td>${bill.bill_month ? new Date(bill.bill_month).toLocaleDateString("en-IN") : "-"}</td>
                    <td>₹${bill.amount}</td>
<td>${bill.due_date ? new Date(bill.due_date).toLocaleDateString("en-IN") : "-"}</td>
                    <td>
    <span class="status-badge status-${bill.status.toLowerCase()}">
        ${bill.status}
    </span>
</td>
                    <td>
                        <button onclick="editMaintenanceBill(${bill.bill_id})">
                            Edit
                        </button>

                        <button onclick="deleteMaintenanceBill(${bill.bill_id})">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
    });
  } catch (error) {
    console.error("Error loading maintenance bills:", error);
  }
}

function showMaintenanceBillForm() {
  document.getElementById("maintenanceBillForm").style.display = "block";
}

function hideMaintenanceBillForm() {
  document.getElementById("maintenanceBillForm").style.display = "none";
}

async function addMaintenanceBill() {
  const apartment_id = document.getElementById("bill_apartment_id").value;

  const bill_month = document.getElementById("bill_month").value;

  const amount = document.getElementById("bill_amount").value;

  const due_date = document.getElementById("bill_due_date").value;

  const status = document.getElementById("bill_status").value;

  try {
    const response = await fetch(`${API}/maintenancebill`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        apartment_id,
        bill_month,
        amount,
        due_date,
        status,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to add maintenance bill");
      return;
    }

    alert("Maintenance bill added successfully!");

    hideMaintenanceBillForm();
    loadMaintenanceBills();
  } catch (error) {
    console.error("Error adding maintenance bill:", error);
  }
}

async function editMaintenanceBill(id) {
  const apartment_id = prompt("Enter apartment ID:");

  if (apartment_id === null) return;

  const bill_month = prompt("Enter bill month (YYYY-MM-DD):");

  if (bill_month === null) return;

  const amount = prompt("Enter amount:");

  if (amount === null) return;

  const due_date = prompt("Enter due date (YYYY-MM-DD):");

  if (due_date === null) return;

  const status = prompt("Enter status (Pending / Paid / Overdue):");

  if (status === null) return;

  try {
    const response = await fetch(`${API}/maintenancebill/${id}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        apartment_id,
        bill_month,
        amount,
        due_date,
        status,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to update maintenance bill");
      return;
    }

    alert("Maintenance bill updated successfully!");

    loadMaintenanceBills();
  } catch (error) {
    console.error("Error updating maintenance bill:", error);
  }
}

async function deleteMaintenanceBill(id) {
  if (!confirm("Are you sure you want to delete this maintenance bill?")) {
    return;
  }

  try {
    const response = await fetch(`${API}/maintenancebill/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to delete maintenance bill");
      return;
    }

    alert("Maintenance bill deleted successfully!");

    loadMaintenanceBills();
  } catch (error) {
    console.error("Error deleting maintenance bill:", error);
  }
}

//==========
// ================= PAYMENTS =================

async function loadPayments() {
  try {
    const response = await fetch(`${API}/payment`);
    const data = await response.json();

    const tableBody = document.getElementById("paymentTableBody");
    tableBody.innerHTML = "";

    data.forEach((payment) => {
      tableBody.innerHTML += `
            <tr>
                <td>${payment.payment_id}</td>
                <td>${payment.bill_id}</td>
            <td>${payment.payment_date ? new Date(payment.payment_date).toLocaleDateString("en-IN") : "-"}</td>
             <td>₹${payment.amount}</td>
                <td>${payment.payment_mode || "-"}</td>
              <td>${payment.reference_number || "-"}</td>
                   <td>
                        <button onclick="editPayment(${payment.payment_id})">
                            Edit
                        </button>

                        <button onclick="deletePayment(${payment.payment_id})">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
    });
  } catch (error) {
    console.error("Error loading payments:", error);
  }
}

function showPaymentForm() {
  document.getElementById("paymentForm").style.display = "block";
}

function hidePaymentForm() {
  document.getElementById("paymentForm").style.display = "none";
}

async function addPayment() {
  const bill_id = document.getElementById("payment_bill_id").value;

  const payment_date = document.getElementById("payment_date").value;

  const amount = document.getElementById("payment_amount").value;

  const payment_mode = document.getElementById("payment_mode").value;

  const reference_number = document.getElementById("payment_reference").value;

  try {
    const response = await fetch(`${API}/payment`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        bill_id,
        payment_date,
        amount,
        payment_mode,
        reference_number,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to add payment");
      return;
    }

    alert("Payment added successfully!");

    hidePaymentForm();
    loadPayments();
  } catch (error) {
    console.error("Error adding payment:", error);
  }
}

async function editPayment(id) {
  const bill_id = prompt("Enter bill ID:");

  if (bill_id === null) return;

  const payment_date = prompt("Enter payment date (YYYY-MM-DD):");

  if (payment_date === null) return;

  const amount = prompt("Enter amount:");

  if (amount === null) return;

  const payment_mode = prompt("Enter payment mode:");

  if (payment_mode === null) return;

  const reference_number = prompt("Enter reference number:");

  if (reference_number === null) return;

  try {
    const response = await fetch(`${API}/payment/${id}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        bill_id,
        payment_date,
        amount,
        payment_mode,
        reference_number,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to update payment");
      return;
    }

    alert("Payment updated successfully!");

    loadPayments();
  } catch (error) {
    console.error("Error updating payment:", error);
  }
}

async function deletePayment(id) {
  if (!confirm("Are you sure you want to delete this payment?")) {
    return;
  }

  try {
    const response = await fetch(`${API}/payment/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to delete payment");
      return;
    }

    alert("Payment deleted successfully!");

    loadPayments();
  } catch (error) {
    console.error("Error deleting payment:", error);
  }
}

// ===============================
// STAFF
// ===============================
// ================= STAFF =================

async function loadStaff() {
  try {
    const response = await fetch(`${API}/staff`);
    const data = await response.json();

    const tableBody = document.getElementById("staffTableBody");
    tableBody.innerHTML = "";

    data.forEach((staff) => {
      tableBody.innerHTML += `
                <tr>
                    <td>${staff.staff_id}</td>
                    <td>${staff.name}</td>
                    <td>${staff.phone || ""}</td>
                    <td>${staff.email || ""}</td>
                    <td>${staff.staff_type}</td>
                    <td>${staff.joining_date ? new Date(staff.joining_date).toLocaleDateString("en-IN") : "-"}</td>
                    <td>
    <span class="status-badge status-${staff.status.toLowerCase()}">
        ${staff.status}
    </span>
</td>
                    <td>
                        <button onclick="editStaff(${staff.staff_id})">
                            Edit
                        </button>

                        <button onclick="deleteStaff(${staff.staff_id})">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
    });
  } catch (error) {
    console.error("Error loading staff:", error);
  }
}

function showStaffForm() {
  document.getElementById("staffForm").style.display = "block";
}

function hideStaffForm() {
  document.getElementById("staffForm").style.display = "none";
}

async function addStaff() {
  const name = document.getElementById("staff_name").value;
  const phone = document.getElementById("staff_phone").value;
  const email = document.getElementById("staff_email").value;
  const staff_type = document.getElementById("staff_type").value;
  const joining_date = document.getElementById("staff_joining_date").value;
  const status = document.getElementById("staff_status").value;

  try {
    const response = await fetch(`${API}/staff`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        name,
        phone,
        email,
        staff_type,
        joining_date,
        status,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to add staff");
      return;
    }

    alert("Staff added successfully!");

    hideStaffForm();
    loadStaff();
  } catch (error) {
    console.error("Error adding staff:", error);
  }
}

async function editStaff(id) {
  const name = prompt("Enter name:");
  if (name === null) return;

  const phone = prompt("Enter phone:");
  if (phone === null) return;

  const email = prompt("Enter email:");
  if (email === null) return;

  const staff_type = prompt("Enter staff type:");
  if (staff_type === null) return;

  const joining_date = prompt("Enter joining date (YYYY-MM-DD):");
  if (joining_date === null) return;

  const status = prompt("Enter status (Active / Inactive):");
  if (status === null) return;

  try {
    const response = await fetch(`${API}/staff/${id}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        name,
        phone,
        email,
        staff_type,
        joining_date,
        status,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to update staff");
      return;
    }

    alert("Staff updated successfully!");

    loadStaff();
  } catch (error) {
    console.error("Error updating staff:", error);
  }
}

async function deleteStaff(id) {
  if (!confirm("Are you sure you want to delete this staff member?")) {
    return;
  }

  try {
    const response = await fetch(`${API}/staff/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to delete staff");
      return;
    }

    alert("Staff deleted successfully!");

    loadStaff();
  } catch (error) {
    console.error("Error deleting staff:", error);
  }
}

// ===============================
// AMENITIES
// ===============================
// ================= AMENITIES =================

async function loadAmenities() {
  try {
    const response = await fetch(`${API}/amenity`);
    const data = await response.json();

    const tableBody = document.getElementById("amenityTableBody");
    tableBody.innerHTML = "";

    data.forEach((amenity) => {
      tableBody.innerHTML += `
                <tr>
                    <td>${amenity.amenity_id}</td>
                    <td>${amenity.name}</td>
                    <td>${amenity.description || ""}</td>
                    <td>${amenity.location || ""}</td>
                    <td>${amenity.capacity || ""}</td>
                    <td>
    <span class="status-badge status-${amenity.status.toLowerCase()}">
        ${amenity.status}
    </span>
</td>
                    <td>
                        <button onclick="editAmenity(${amenity.amenity_id})">
                            Edit
                        </button>

                        <button onclick="deleteAmenity(${amenity.amenity_id})">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
    });
  } catch (error) {
    console.error("Error loading amenities:", error);
  }
}

function showAmenityForm() {
  document.getElementById("amenityForm").style.display = "block";
}

function hideAmenityForm() {
  document.getElementById("amenityForm").style.display = "none";
}

async function addAmenity() {
  const name = document.getElementById("amenity_name").value;

  const description = document.getElementById("amenity_description").value;

  const location = document.getElementById("amenity_location").value;

  const capacity = document.getElementById("amenity_capacity").value;

  const status = document.getElementById("amenity_status").value;

  try {
    const response = await fetch(`${API}/amenity`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        name,
        description,
        location,
        capacity,
        status,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to add amenity");
      return;
    }

    alert("Amenity added successfully!");

    hideAmenityForm();
    loadAmenities();
  } catch (error) {
    console.error("Error adding amenity:", error);
  }
}

async function editAmenity(id) {
  const name = prompt("Enter amenity name:");

  if (name === null) return;

  const description = prompt("Enter description:");

  if (description === null) return;

  const location = prompt("Enter location:");

  if (location === null) return;

  const capacity = prompt("Enter capacity:");

  if (capacity === null) return;

  const status = prompt("Enter status (Available / Unavailable):");

  if (status === null) return;

  try {
    const response = await fetch(`${API}/amenity/${id}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        name,
        description,
        location,
        capacity,
        status,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to update amenity");
      return;
    }

    alert("Amenity updated successfully!");

    loadAmenities();
  } catch (error) {
    console.error("Error updating amenity:", error);
  }
}

async function deleteAmenity(id) {
  if (!confirm("Are you sure you want to delete this amenity?")) {
    return;
  }

  try {
    const response = await fetch(`${API}/amenity/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to delete amenity");
      return;
    }

    alert("Amenity deleted successfully!");

    loadAmenities();
  } catch (error) {
    console.error("Error deleting amenity:", error);
  }
}

//================
//complaints
//==================
// ================= COMPLAINTS =================

async function loadComplaints() {
  try {
    const response = await fetch(`${API}/complaint`);
    const data = await response.json();

    const tableBody = document.getElementById("complaintTableBody");
    tableBody.innerHTML = "";

    data.forEach((complaint) => {
      tableBody.innerHTML += `
                <tr>
                    <td>${complaint.complaint_id}</td>
                    <td>${complaint.resident_id}</td>
                    <td>${complaint.assigned_staff_id || ""}</td>
                    <td>${complaint.category}</td>
                    <td>${complaint.description}</td>
                    <td>${complaint.priority}</td>
                    <td>
    <span class="status-badge status-${complaint.status
      .toLowerCase()
      .replace(" ", "-")}">
        ${complaint.status}
    </span>
</td>
                    <td>${complaint.created_at ? new Date(complaint.created_at).toLocaleString("en-IN") : "-"}</td>
<td>${complaint.resolved_at ? new Date(complaint.resolved_at).toLocaleString("en-IN") : "-"}</td>
                    <td>
                        <button onclick="editComplaint(${complaint.complaint_id})">
                            Edit
                        </button>

                        <button onclick="deleteComplaint(${complaint.complaint_id})">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
    });
  } catch (error) {
    console.error("Error loading complaints:", error);
  }
}

function showComplaintForm() {
  document.getElementById("complaintForm").style.display = "block";
}

function hideComplaintForm() {
  document.getElementById("complaintForm").style.display = "none";
}

async function addComplaint() {
  const resident_id = document.getElementById("complaint_resident_id").value;

  const assigned_staff_id =
    document.getElementById("complaint_staff_id").value || null;

  const category = document.getElementById("complaint_category").value;

  const description = document.getElementById("complaint_description").value;

  const priority = document.getElementById("complaint_priority").value;

  const status = document.getElementById("complaint_status").value;

  try {
    const response = await fetch(`${API}/complaint`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        resident_id,
        assigned_staff_id,
        category,
        description,
        priority,
        status,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to add complaint");
      return;
    }

    alert("Complaint added successfully!");

    hideComplaintForm();
    loadComplaints();
  } catch (error) {
    console.error("Error adding complaint:", error);
  }
}

async function editComplaint(id) {
  const resident_id = prompt("Enter resident ID:");

  if (resident_id === null) return;

  const assigned_staff_id = prompt(
    "Enter assigned staff ID (leave blank if none):",
  );

  if (assigned_staff_id === null) return;

  const category = prompt("Enter category:");

  if (category === null) return;

  const description = prompt("Enter description:");

  if (description === null) return;

  const priority = prompt("Enter priority (Low / Medium / High):");

  if (priority === null) return;

  const status = prompt("Enter status (Pending / In Progress / Solved):");

  if (status === null) return;

  try {
    const response = await fetch(`${API}/complaint/${id}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        resident_id,
        assigned_staff_id: assigned_staff_id || null,
        category,
        description,
        priority,
        status,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to update complaint");
      return;
    }

    alert("Complaint updated successfully!");

    loadComplaints();
  } catch (error) {
    console.error("Error updating complaint:", error);
  }
}

async function deleteComplaint(id) {
  if (!confirm("Are you sure you want to delete this complaint?")) {
    return;
  }

  try {
    const response = await fetch(`${API}/complaint/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to delete complaint");
      return;
    }

    alert("Complaint deleted successfully!");

    loadComplaints();
  } catch (error) {
    console.error("Error deleting complaint:", error);
  }
}

// ================= GYM MEMBERSHIPS =================

async function loadGymMemberships() {
  try {
    const response = await fetch(`${API}/gymmembership`);
    const data = await response.json();

    const tableBody = document.getElementById("gymTableBody");
    tableBody.innerHTML = "";

    data.forEach((membership) => {
      tableBody.innerHTML += `
                <tr>
                    <td>${membership.membership_id}</td>
                    <td>${membership.resident_id}</td>
                    <td>${membership.plan_name}</td>
                    <td>${membership.start_date ? new Date(membership.start_date).toLocaleDateString("en-IN") : "-"}</td>
<td>${membership.end_date ? new Date(membership.end_date).toLocaleDateString("en-IN") : "-"}</td>
                    <td>₹${membership.fee ? Number(membership.fee).toFixed(2) : "0.00"}</td>
                    <td>
    <span class="status-badge status-${membership.status.toLowerCase()}">
        ${membership.status}
    </span>
</td>
                    <td>
                        <button onclick="editGymMembership(${membership.membership_id})">
                            Edit
                        </button>

                        <button onclick="deleteGymMembership(${membership.membership_id})">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
    });
  } catch (error) {
    console.error("Error loading gym memberships:", error);
  }
}

function showGymForm() {
  document.getElementById("gymForm").style.display = "block";
}

function hideGymForm() {
  document.getElementById("gymForm").style.display = "none";
}

async function addGymMembership() {
  const resident_id = document.getElementById("gym_resident_id").value;

  const plan_name = document.getElementById("gym_plan_name").value;

  const start_date = document.getElementById("gym_start_date").value;

  const end_date = document.getElementById("gym_end_date").value || null;

  const fee = document.getElementById("gym_fee").value;

  const status = document.getElementById("gym_status").value;

  try {
    const response = await fetch(`${API}/gymmembership`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        resident_id,
        plan_name,
        start_date,
        end_date,
        fee,
        status,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to add membership");
      return;
    }

    alert("Gym membership added successfully!");

    hideGymForm();
    loadGymMemberships();
  } catch (error) {
    console.error("Error adding gym membership:", error);
  }
}

async function editGymMembership(id) {
  const resident_id = prompt("Enter resident ID:");

  if (resident_id === null) return;

  const plan_name = prompt("Enter plan name:");

  if (plan_name === null) return;

  const start_date = prompt("Enter start date (YYYY-MM-DD):");

  if (start_date === null) return;

  const end_date = prompt("Enter end date (YYYY-MM-DD, leave blank if none):");

  if (end_date === null) return;

  const fee = prompt("Enter fee:");

  if (fee === null) return;

  const status = prompt("Enter status (Active / Inactive / Expired):");

  if (status === null) return;

  try {
    const response = await fetch(`${API}/gymmembership/${id}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        resident_id,
        plan_name,
        start_date,
        end_date: end_date || null,
        fee,
        status,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to update membership");
      return;
    }

    alert("Gym membership updated successfully!");

    loadGymMemberships();
  } catch (error) {
    console.error("Error updating gym membership:", error);
  }
}

async function deleteGymMembership(id) {
  if (!confirm("Are you sure you want to delete this membership?")) {
    return;
  }

  try {
    const response = await fetch(`${API}/gymmembership/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to delete membership");
      return;
    }

    alert("Gym membership deleted successfully!");

    loadGymMemberships();
  } catch (error) {
    console.error("Error deleting gym membership:", error);
  }
}

//================================
//gym attendance
//===========================
// ================= GYM ATTENDANCE =================

async function loadGymAttendance() {
  try {
    const response = await fetch(`${API}/gymattendance`);
    const data = await response.json();

    const tableBody = document.getElementById("gymAttendanceTableBody");
    tableBody.innerHTML = "";

    data.forEach((attendance) => {
      tableBody.innerHTML += `
                <tr>
                    <td>${attendance.attendance_id}</td>
                    <td>${attendance.resident_id}</td>
                    <td>${attendance.membership_id || "-"}</td>
        <td>
            ${attendance.check_in
                ? new Date(attendance.check_in).toLocaleString("en-IN")
                : "-"}
        </td>
        <td>
            ${attendance.check_out
                ? new Date(attendance.check_out).toLocaleString("en-IN")
                : "-"}
        </td>

                    <td>
            <button onclick="editGymAttendance(${attendance.attendance_id})">
                Edit
            </button>
            <button onclick="deleteGymAttendance(${attendance.attendance_id})">
                Delete
            </button>
        </td>

                </tr>
            `;
    });
  } catch (error) {
    console.error("Error loading gym attendance:", error);
  }
}

function showGymAttendanceForm() {
  document.getElementById("gymAttendanceForm").style.display = "block";
}

function hideGymAttendanceForm() {
  document.getElementById("gymAttendanceForm").style.display = "none";
}

async function addGymAttendance() {
  const resident_id = document.getElementById("attendance_resident_id").value;

  const membership_id =
    document.getElementById("attendance_membership_id").value || null;

  const check_in = document.getElementById("attendance_check_in").value;

  const check_out =
    document.getElementById("attendance_check_out").value || null;

  try {
    const response = await fetch(`${API}/gymattendance`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        resident_id,
        membership_id,
        check_in,
        check_out,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to add attendance");
      return;
    }

    alert("Gym attendance added successfully!");

    hideGymAttendanceForm();
    loadGymAttendance();
  } catch (error) {
    console.error("Error adding gym attendance:", error);
  }
}

async function editGymAttendance(id) {
  const resident_id = prompt("Enter resident ID:");

  if (resident_id === null) return;

  const membership_id = prompt("Enter membership ID (leave blank if none):");

  if (membership_id === null) return;

  const check_in = prompt("Enter check-in (YYYY-MM-DD HH:MM:SS):");

  if (check_in === null) return;

  const check_out = prompt(
    "Enter check-out (YYYY-MM-DD HH:MM:SS, leave blank if none):",
  );

  if (check_out === null) return;

  try {
    const response = await fetch(`${API}/gymattendance/${id}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        resident_id,
        membership_id: membership_id || null,
        check_in,
        check_out: check_out || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to update attendance");
      return;
    }

    alert("Gym attendance updated successfully!");

    loadGymAttendance();
  } catch (error) {
    console.error("Error updating gym attendance:", error);
  }
}

async function deleteGymAttendance(id) {
  if (!confirm("Are you sure you want to delete this attendance record?")) {
    return;
  }

  try {
    const response = await fetch(`${API}/gymattendance/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to delete attendance");
      return;
    }

    alert("Gym attendance deleted successfully!");

    loadGymAttendance();
  } catch (error) {
    console.error("Error deleting gym attendance:", error);
  }
}

//amenity booking
//===============================================================================
// ================= AMENITY BOOKINGS =================

async function loadAmenityBookings() {
  try {
    const response = await fetch(`${API}/amenitybooking`);
    const data = await response.json();

    const tableBody = document.getElementById("amenityBookingTableBody");
    tableBody.innerHTML = "";

    data.forEach((booking) => {
      tableBody.innerHTML += `
    <tr>
        <td>${booking.booking_id}</td>
        <td>${booking.resident_id}</td>
        <td>${booking.amenity_id}</td>
        <td>${booking.booking_date ? new Date(booking.booking_date).toLocaleDateString("en-IN") : "-"}</td>
        <td>${booking.start_time || "-"}</td>
        <td>${booking.end_time || "-"}</td>
        <td>
            <span class="status-badge status-${booking.status.toLowerCase()}">
                ${booking.status}
            </span>
        </td>
        <td>
            <button onclick="editAmenityBooking(${booking.booking_id})">
                Edit
            </button>
            <button onclick="deleteAmenityBooking(${booking.booking_id})">
                Delete
            </button>
        </td>
    </tr>
`;
    });
  } catch (error) {
    console.error("Error loading amenity bookings:", error);
  }
}

function showAmenityBookingForm() {
  document.getElementById("amenityBookingForm").style.display = "block";
}

function hideAmenityBookingForm() {
  document.getElementById("amenityBookingForm").style.display = "none";
}

async function addAmenityBooking() {
  const resident_id = document.getElementById("booking_resident_id").value;

  const amenity_id = document.getElementById("booking_amenity_id").value;

  const booking_date = document.getElementById("booking_date").value;

  const start_time = document.getElementById("booking_start_time").value;

  const end_time = document.getElementById("booking_end_time").value;

  const status = document.getElementById("booking_status").value;

  try {
    const response = await fetch(`${API}/amenitybooking`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        resident_id,
        amenity_id,
        booking_date,
        start_time,
        end_time,
        status,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to add booking");
      return;
    }

    alert("Amenity booking added successfully!");

    hideAmenityBookingForm();
    loadAmenityBookings();
  } catch (error) {
    console.error("Error adding amenity booking:", error);
  }
}

async function editAmenityBooking(id) {
  const resident_id = prompt("Enter resident ID:");

  if (resident_id === null) return;

  const amenity_id = prompt("Enter amenity ID:");

  if (amenity_id === null) return;

  const booking_date = prompt("Enter booking date (YYYY-MM-DD):");

  if (booking_date === null) return;

  const start_time = prompt("Enter start time (HH:MM:SS):");

  if (start_time === null) return;

  const end_time = prompt("Enter end time (HH:MM:SS):");

  if (end_time === null) return;

  const status = prompt("Enter status (Booked / Cancelled / Completed):");

  if (status === null) return;

  try {
    const response = await fetch(`${API}/amenitybooking/${id}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        resident_id,
        amenity_id,
        booking_date,
        start_time,
        end_time,
        status,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to update booking");
      return;
    }

    alert("Amenity booking updated successfully!");

    loadAmenityBookings();
  } catch (error) {
    console.error("Error updating amenity booking:", error);
  }
}

async function deleteAmenityBooking(id) {
  if (!confirm("Are you sure you want to delete this booking?")) {
    return;
  }

  try {
    const response = await fetch(`${API}/amenitybooking/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to delete booking");
      return;
    }

    alert("Amenity booking deleted successfully!");

    loadAmenityBookings();
  } catch (error) {
    console.error("Error deleting amenity booking:", error);
  }
}

// ================= VISITORS =================

async function loadVisitors() {
  try {
    const response = await fetch(`${API}/visitor`);
    const data = await response.json();

    const tableBody = document.getElementById("visitorTableBody");
    tableBody.innerHTML = "";

    data.forEach((visitor) => {
     tableBody.innerHTML += `
    <tr>
        <td>${visitor.visitor_id}</td>
        <td>${visitor.resident_id}</td>
        <td>${visitor.visitor_name}</td>
        <td>${visitor.phone || "-"}</td>
        <td>${visitor.purpose || "-"}</td>
        <td>${visitor.vehicle_number || "-"}</td>
        <td>
            ${visitor.entry_time
                ? new Date(visitor.entry_time).toLocaleString("en-IN")
                : "-"}
        </td>
        <td>
            ${visitor.exit_time
                ? new Date(visitor.exit_time).toLocaleString("en-IN")
                : "-"}
        </td>
        <td>
            <button onclick="editVisitor(${visitor.visitor_id})">
                Edit
            </button>
            <button onclick="deleteVisitor(${visitor.visitor_id})">
                Delete
            </button>
        </td>
    </tr>
`;
    });
  } catch (error) {
    console.error("Error loading visitors:", error);
  }
}

function showVisitorForm() {
  document.getElementById("visitorForm").style.display = "block";
}

function hideVisitorForm() {
  document.getElementById("visitorForm").style.display = "none";
}

async function addVisitor() {
  const resident_id = document.getElementById("visitor_resident_id").value;

  const visitor_name = document.getElementById("visitor_name").value;

  const phone = document.getElementById("visitor_phone").value;

  const purpose = document.getElementById("visitor_purpose").value;

  const vehicle_number = document.getElementById(
    "visitor_vehicle_number",
  ).value;

  const entry_time = document.getElementById("visitor_entry_time").value;

  const exit_time = document.getElementById("visitor_exit_time").value || null;

  try {
    const response = await fetch(`${API}/visitor`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        resident_id,
        visitor_name,
        phone,
        purpose,
        vehicle_number,
        entry_time,
        exit_time,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to add visitor");
      return;
    }

    alert("Visitor added successfully!");

    hideVisitorForm();
    loadVisitors();
  } catch (error) {
    console.error("Error adding visitor:", error);
  }
}

async function editVisitor(id) {
  const resident_id = prompt("Enter resident ID:");

  if (resident_id === null) return;

  const visitor_name = prompt("Enter visitor name:");

  if (visitor_name === null) return;

  const phone = prompt("Enter phone:");

  if (phone === null) return;

  const purpose = prompt("Enter purpose:");

  if (purpose === null) return;

  const vehicle_number = prompt("Enter vehicle number (leave blank if none):");

  if (vehicle_number === null) return;

  const entry_time = prompt("Enter entry time (YYYY-MM-DD HH:MM:SS):");

  if (entry_time === null) return;

  const exit_time = prompt(
    "Enter exit time (YYYY-MM-DD HH:MM:SS, leave blank if none):",
  );

  if (exit_time === null) return;

  try {
    const response = await fetch(`${API}/visitor/${id}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        resident_id,
        visitor_name,
        phone,
        purpose,
        vehicle_number,
        entry_time,
        exit_time: exit_time || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to update visitor");
      return;
    }

    alert("Visitor updated successfully!");

    loadVisitors();
  } catch (error) {
    console.error("Error updating visitor:", error);
  }
}

async function deleteVisitor(id) {
  if (!confirm("Are you sure you want to delete this visitor record?")) {
    return;
  }

  try {
    const response = await fetch(`${API}/visitor/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to delete visitor");
      return;
    }

    alert("Visitor deleted successfully!");

    loadVisitors();
  } catch (error) {
    console.error("Error deleting visitor:", error);
  }
}

// ================= DELIVERIES ===============================================================

async function loadDeliveries() {
  try {
    const response = await fetch(`${API}/delivery`);
    const data = await response.json();

    const tableBody = document.getElementById("deliveryTableBody");
    tableBody.innerHTML = "";

    data.forEach((delivery) => {
      tableBody.innerHTML += `
    <tr>
        <td>${delivery.delivery_id}</td>
        <td>${delivery.resident_id}</td>
        <td>${delivery.delivery_person}</td>
        <td>${delivery.delivery_company || "-"}</td>
        <td>${delivery.package_details || "-"}</td>
        <td>${delivery.vehicle_number || "-"}</td>
        <td>
            ${delivery.arrival_time
                ? new Date(delivery.arrival_time).toLocaleString("en-IN")
                : "-"}
        </td>
        <td>
            ${delivery.collected_time
                ? new Date(delivery.collected_time).toLocaleString("en-IN")
                : "-"}
        </td>
        <td>
            <span class="status-badge status-${delivery.status.toLowerCase()}">
                ${delivery.status}
            </span>
        </td>
        <td>
            <button onclick="editDelivery(${delivery.delivery_id})">
                Edit
            </button>
            <button onclick="deleteDelivery(${delivery.delivery_id})">
                Delete
            </button>
        </td>
    </tr>
`;
    });
  } catch (error) {
    console.error("Error loading deliveries:", error);
  }
}

function showDeliveryForm() {
  document.getElementById("deliveryForm").style.display = "block";
}

function hideDeliveryForm() {
  document.getElementById("deliveryForm").style.display = "none";
}

async function addDelivery() {
  const resident_id = document.getElementById("delivery_resident_id").value;

  const delivery_person = document.getElementById("delivery_person").value;

  const delivery_company = document.getElementById("delivery_company").value;

  const package_details = document.getElementById(
    "delivery_package_details",
  ).value;

  const vehicle_number = document.getElementById(
    "delivery_vehicle_number",
  ).value;

  const arrival_time = document.getElementById("delivery_arrival_time").value;

  const status = document.getElementById("delivery_status").value;

  try {
    const response = await fetch(`${API}/delivery`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        resident_id,
        delivery_person,
        delivery_company,
        package_details,
        vehicle_number,
        arrival_time,
        status,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to add delivery");
      return;
    }

    alert("Delivery added successfully!");

    hideDeliveryForm();
    loadDeliveries();
  } catch (error) {
    console.error("Error adding delivery:", error);
  }
}

async function editDelivery(id) {
  const resident_id = prompt("Enter resident ID:");

  if (resident_id === null) return;

  const delivery_person = prompt("Enter delivery person:");

  if (delivery_person === null) return;

  const delivery_company = prompt("Enter delivery company:");

  if (delivery_company === null) return;

  const package_details = prompt("Enter package details:");

  if (package_details === null) return;

  const vehicle_number = prompt("Enter vehicle number (leave blank if none):");

  if (vehicle_number === null) return;

  const arrival_time = prompt("Enter arrival time (YYYY-MM-DD HH:MM:SS):");

  if (arrival_time === null) return;

  const status = prompt("Enter status (Pending / Collected):");

  if (status === null) return;

  try {
    const response = await fetch(`${API}/delivery/${id}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        resident_id,
        delivery_person,
        delivery_company,
        package_details,
        vehicle_number,
        arrival_time,
        status,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to update delivery");
      return;
    }

    alert("Delivery updated successfully!");

    loadDeliveries();
  } catch (error) {
    console.error("Error updating delivery:", error);
  }
}

async function deleteDelivery(id) {
  if (!confirm("Are you sure you want to delete this delivery?")) {
    return;
  }

  try {
    const response = await fetch(`${API}/delivery/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to delete delivery");
      return;
    }

    alert("Delivery deleted successfully!");

    loadDeliveries();
  } catch (error) {
    console.error("Error deleting delivery:", error);
  }
}

// ===============================
// LOAD DASHBOARD ON START
// ===============================

loadDashboardCounts();
loadApartments();
loadRecentComplaints();
loadResidents();
loadFamilyMembers();
loadParking();
loadVehicles();
loadMaintenanceBills();
loadPayments();
loadStaff();
loadComplaints();
loadGymMemberships();
loadGymAttendance();
loadAmenities();
loadAmenityBookings();
loadVisitors();
loadDeliveries();
loadRecentComplaints();

// ================= LOGOUT =================

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("owner");

    window.location.href = "login.html";
}