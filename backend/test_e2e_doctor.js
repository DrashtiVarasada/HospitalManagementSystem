const http = require('http');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: '.env' });

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/prescriptions', prescriptionRoutes);

async function runTests() {
  console.log('====================================================');
  console.log('STARTING END-TO-END DOCTOR INTEGRATION TEST SUITE');
  console.log('====================================================');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected successfully.');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5099, resolve));
  const baseUrl = 'http://localhost:5099/api';
  console.log(`Test server running at http://localhost:5099/api`);

  let doctorToken = null;
  let doctorProfile = null;
  let testPatient = null;
  let createdRecordId = null;
  let visit1Id = null;
  let visit2Id = null;
  let prescription1Id = null;
  let prescription2Id = null;

  try {
    // -----------------------------------------------------------
    // TEST 1: Doctor Login
    // -----------------------------------------------------------
    console.log('\n[TEST 1] Logging in as Doctor (jaypatel@hospital.com)...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jaypatel@hospital.com', password: 'Jay@123' })
    });
    const loginData = await loginRes.json();
    if (loginRes.status !== 200 || !loginData.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }
    doctorToken = loginData.token;
    console.log('SUCCESS: Doctor logged in, token received. Role:', loginData.user?.role);

    // -----------------------------------------------------------
    // TEST 2: Doctor Profile (/doctors/me)
    // -----------------------------------------------------------
    console.log('\n[TEST 2] Fetching Doctor profile (/doctors/me)...');
    const docMeRes = await fetch(`${baseUrl}/doctors/me`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    const docMeData = await docMeRes.json();
    if (docMeRes.status !== 200 || !docMeData.doctor) {
      throw new Error(`Failed to fetch doctor profile: ${JSON.stringify(docMeData)}`);
    }
    doctorProfile = docMeData.doctor;
    console.log(`SUCCESS: Doctor profile: Dr. ${doctorProfile.name}, Specialization: ${doctorProfile.specialization}`);

    // -----------------------------------------------------------
    // TEST 3: Search Patient by Name
    // -----------------------------------------------------------
    console.log('\n[TEST 3] Searching patient by name (?search=Priya)...');
    const searchRes = await fetch(`${baseUrl}/patients?search=priya`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    const searchData = await searchRes.json();
    if (searchRes.status !== 200 || !Array.isArray(searchData.patients)) {
      throw new Error(`Patient search failed: ${JSON.stringify(searchData)}`);
    }
    console.log(`SUCCESS: Found ${searchData.patients.length} matching patients. First match: ${searchData.patients[0]?.name}`);

    // Create a fresh test patient for isolated testing
    const Patient = require('./models/Patient');
    const testPatientDoc = await Patient.create({
      name: `DoctorTest Patient ${Date.now()}`,
      dateOfBirth: new Date('1990-05-15'),
      gender: 'female',
      phone: `9898${Math.floor(100000 + Math.random() * 900000)}`,
      email: `doctortest_${Date.now()}@example.com`,
      bloodGroup: 'B+',
      address: '123 Medical Park'
    });
    testPatient = testPatientDoc.toObject();
    console.log(`Created isolated test patient: ${testPatient.name} (ID: ${testPatient._id})`);

    // -----------------------------------------------------------
    // TEST 4: Case 2 - Patient Found but NO Medical Record Exists
    // -----------------------------------------------------------
    console.log('\n[TEST 4] Case 2: Checking history for new patient (should have no record)...');
    const histNoRecRes = await fetch(`${baseUrl}/medical-records/patient/${testPatient._id}`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    const histNoRecData = await histNoRecRes.json();
    console.log(`Status: ${histNoRecRes.status}, Response:`, histNoRecData);
    if (histNoRecRes.status === 404 || histNoRecData.totalVisits === 0) {
      console.log('SUCCESS: Correctly identifies that patient has NO existing medical record.');
    } else {
      throw new Error('Expected 404 or 0 visits for new patient');
    }

    // -----------------------------------------------------------
    // TEST 5: Create First Medical Record and First Visit
    // -----------------------------------------------------------
    console.log('\n[TEST 5] Creating first medical record and first visit...');
    const createRecRes = await fetch(`${baseUrl}/medical-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        patient: testPatient._id,
        symptoms: 'High fever 102F, severe chills, fatigue',
        diagnosis: 'Acute Viral Fever',
        examination: 'Temperature 102.4F, Pulse 92, Chest clear',
        treatment: 'Antipyretics, hydration, rest',
        notes: 'Advised CBC blood test if fever continues beyond 3 days'
      })
    });
    const createRecData = await createRecRes.json();
    if (createRecRes.status !== 201 || !createRecData.medicalRecord) {
      throw new Error(`Failed to create medical record: ${JSON.stringify(createRecData)}`);
    }
    createdRecordId = createRecData.medicalRecord._id;
    visit1Id = createRecData.createdVisitId;
    console.log(`SUCCESS: First medical record created. Record ID: ${createdRecordId}, Visit 1 ID: ${visit1Id}`);
    console.log(`Visits count: ${createRecData.medicalRecord.visits.length}`);

    // -----------------------------------------------------------
    // TEST 6: Create Prescription for Visit 1
    // -----------------------------------------------------------
    console.log('\n[TEST 6] Creating prescription for Visit 1...');
    const rx1Res = await fetch(`${baseUrl}/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        patient: testPatient._id,
        medicalRecord: createdRecordId,
        visitId: visit1Id,
        medicines: [
          {
            medicineName: 'Paracetamol',
            dosage: '650 mg',
            frequency: 'Thrice daily',
            duration: '3 days',
            instructions: 'Take after meals with water'
          },
          {
            medicineName: 'Vitamin C',
            dosage: '500 mg',
            frequency: 'Once daily',
            duration: '5 days',
            instructions: 'Chewable tablet after breakfast'
          }
        ],
        additionalInstructions: 'Drink at least 3 liters of water daily. Complete bed rest.'
      })
    });
    const rx1Data = await rx1Res.json();
    if (rx1Res.status !== 201 || !rx1Data.prescription) {
      throw new Error(`Failed to create prescription 1: ${JSON.stringify(rx1Data)}`);
    }
    prescription1Id = rx1Data.prescription._id;
    console.log(`SUCCESS: Prescription 1 created. ID: ${prescription1Id}, Medicines: ${rx1Data.prescription.medicines.length}`);

    // -----------------------------------------------------------
    // TEST 7: Case 1 - Patient Has Existing Medical Record & Add 2nd Visit
    // -----------------------------------------------------------
    console.log('\n[TEST 7] Case 1: Checking patient history now (should show existing record & visit 1)...');
    const histExistRes = await fetch(`${baseUrl}/medical-records/patient/${testPatient._id}`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    const histExistData = await histExistRes.json();
    if (histExistRes.status !== 200 || histExistData.totalVisits !== 1) {
      throw new Error(`Failed to get history: ${JSON.stringify(histExistData)}`);
    }
    console.log(`SUCCESS: Existing record found! Total visits: ${histExistData.totalVisits}`);
    console.log(`Prescriptions for Visit 1: ${histExistData.medicalRecord.visits[0].prescriptions?.length}`);

    console.log('\nAdding NEW visit to the EXISTING record (NO duplicate MedicalRecord document)...');
    const addVisitRes = await fetch(`${baseUrl}/medical-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        patient: testPatient._id,
        symptoms: 'Fever reduced to 99F, mild productive cough',
        diagnosis: 'Post-viral Bronchial Irritation',
        examination: 'BP 118/76, throat clear, mild wheeze',
        treatment: 'Cough syrup, warm saline gargles',
        notes: 'Follow-up consultation. Patient improving.'
      })
    });
    const addVisitData = await addVisitRes.json();
    if (addVisitRes.status !== 201 && addVisitRes.status !== 200) {
      throw new Error(`Failed to add 2nd visit: ${JSON.stringify(addVisitData)}`);
    }
    const updatedRecord = addVisitData.medicalRecord;
    visit2Id = addVisitData.createdVisitId;

    // Verify same record ID (no duplicate document)
    if (updatedRecord._id.toString() !== createdRecordId.toString()) {
      throw new Error(`DUPLICATE MEDICAL RECORD CREATED! Old: ${createdRecordId}, New: ${updatedRecord._id}`);
    }
    if (updatedRecord.visits.length !== 2) {
      throw new Error(`Expected 2 visits in record, got ${updatedRecord.visits.length}`);
    }
    console.log(`SUCCESS: 2nd visit added to same record document (${createdRecordId}). Total visits now: 2. Visit 2 ID: ${visit2Id}`);

    // Verify DB count of MedicalRecords for this patient
    const MedicalRecord = require('./models/MedicalRecord');
    const recordCount = await MedicalRecord.countDocuments({ patient: testPatient._id });
    if (recordCount !== 1) {
      throw new Error(`CRITICAL: Found ${recordCount} MedicalRecord documents for patient! Expected strictly 1.`);
    }
    console.log(`DATABASE CHECK: Verified strictly 1 MedicalRecord document exists in collection for this patient.`);

    // -----------------------------------------------------------
    // TEST 8: Create Prescription for Visit 2
    // -----------------------------------------------------------
    console.log('\n[TEST 8] Creating prescription for Visit 2...');
    const rx2Res = await fetch(`${baseUrl}/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        patient: testPatient._id,
        medicalRecord: createdRecordId,
        visitId: visit2Id,
        medicines: [
          {
            medicineName: 'Ambroxol Cough Syrup',
            dosage: '10 ml',
            frequency: 'Twice daily',
            duration: '5 days',
            instructions: 'Take with warm water before bed'
          }
        ],
        additionalInstructions: 'Avoid cold beverages and dusty environments.'
      })
    });
    const rx2Data = await rx2Res.json();
    if (rx2Res.status !== 201 || !rx2Data.prescription) {
      throw new Error(`Failed to create prescription 2: ${JSON.stringify(rx2Data)}`);
    }
    prescription2Id = rx2Data.prescription._id;
    console.log(`SUCCESS: Prescription 2 created. ID: ${prescription2Id}`);

    // Verify getPrescriptionsByVisit returns correct prescription for each visit
    const rxByVisit1 = await fetch(`${baseUrl}/prescriptions/visit/${visit1Id}`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    }).then(r => r.json());
    const rxByVisit2 = await fetch(`${baseUrl}/prescriptions/visit/${visit2Id}`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    }).then(r => r.json());
    if (rxByVisit1.prescriptions[0]._id !== prescription1Id || rxByVisit2.prescriptions[0]._id !== prescription2Id) {
      throw new Error('Prescription to visit linking verification failed');
    }
    console.log(`SUCCESS: Visit 1 links to Prescription 1, Visit 2 links to Prescription 2. No cross-attachment!`);

    // -----------------------------------------------------------
    // TEST 9: Update Medical Visit
    // -----------------------------------------------------------
    console.log('\n[TEST 9] Updating Visit 1 details (diagnosis & treatment)...');
    const updateVisitRes = await fetch(`${baseUrl}/medical-records/${createdRecordId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        visitId: visit1Id,
        diagnosis: 'Acute Viral Fever (Confirmed Dengue Negative)',
        treatment: 'Antipyretics, oral rehydration therapy, platelet count monitor'
      })
    });
    const updateVisitData = await updateVisitRes.json();
    if (updateVisitRes.status !== 200) {
      throw new Error(`Failed to update visit: ${JSON.stringify(updateVisitData)}`);
    }
    const updatedV1 = updateVisitData.medicalRecord.visits.find(v => v._id === visit1Id);
    const unchangedV2 = updateVisitData.medicalRecord.visits.find(v => v._id === visit2Id);
    if (!updatedV1.diagnosis.includes('Confirmed Dengue Negative')) {
      throw new Error('Visit 1 diagnosis was not updated');
    }
    if (!unchangedV2.diagnosis.includes('Post-viral Bronchial Irritation')) {
      throw new Error('Visit 2 was accidentally mutated by Visit 1 update!');
    }
    console.log('SUCCESS: Visit 1 updated accurately without affecting Visit 2.');

    // -----------------------------------------------------------
    // TEST 10: Update Prescription
    // -----------------------------------------------------------
    console.log('\n[TEST 10] Updating Prescription 1...');
    const updateRxRes = await fetch(`${baseUrl}/prescriptions/${prescription1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        medicines: [
          {
            medicineName: 'Paracetamol',
            dosage: '500 mg',
            frequency: 'Twice daily',
            duration: '2 days',
            instructions: 'Taper off dosage as fever subsides'
          }
        ],
        additionalInstructions: 'Resume normal diet gradually.'
      })
    });
    const updateRxData = await updateRxRes.json();
    if (updateRxRes.status !== 200) {
      throw new Error(`Failed to update prescription: ${JSON.stringify(updateRxData)}`);
    }
    console.log('SUCCESS: Prescription 1 updated successfully with new dosage and instructions.');

    // -----------------------------------------------------------
    // TEST 11: Cascade Deletion on Visit Deletion
    // -----------------------------------------------------------
    console.log('\n[TEST 11] Testing safe cascade deletion of Visit 2 and its Prescription...');
    const deleteVisitRes = await fetch(`${baseUrl}/medical-records/${createdRecordId}?visitId=${visit2Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    const deleteVisitData = await deleteVisitRes.json();
    if (deleteVisitRes.status !== 200) {
      throw new Error(`Failed to delete visit: ${JSON.stringify(deleteVisitData)}`);
    }
    console.log('Delete visit response:', deleteVisitData.message);

    // Verify Prescription 2 is deleted from DB (no orphan prescription)
    const Prescription = require('./models/Prescription');
    const rx2InDb = await Prescription.findById(prescription2Id);
    if (rx2InDb) {
      throw new Error(`ORPHANED PRESCRIPTION DETECTED! Prescription ${prescription2Id} still exists after visit was deleted.`);
    }
    console.log('SUCCESS: Prescription 2 was automatically deleted with Visit 2 (no orphaned prescriptions).');

    // Verify Visit 1 and Prescription 1 still intact
    const rx1InDb = await Prescription.findById(prescription1Id);
    if (!rx1InDb) {
      throw new Error('Prescription 1 was erroneously deleted!');
    }
    console.log('SUCCESS: Visit 1 and Prescription 1 remain intact.');

    // -----------------------------------------------------------
    // TEST 12: Delete Prescription directly
    // -----------------------------------------------------------
    console.log('\n[TEST 12] Deleting Prescription 1 directly...');
    const deleteRxRes = await fetch(`${baseUrl}/prescriptions/${prescription1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    if (deleteRxRes.status !== 200) {
      throw new Error('Failed to delete prescription 1 directly');
    }
    const rx1Deleted = await Prescription.findById(prescription1Id);
    if (rx1Deleted) {
      throw new Error('Prescription 1 still exists after deletion');
    }
    console.log('SUCCESS: Prescription 1 deleted directly.');

    // -----------------------------------------------------------
    // TEST 13: RBAC - Unauthorized Access Blocked
    // -----------------------------------------------------------
    console.log('\n[TEST 13] Testing Role-Based Authorization...');
    const unauthRes = await fetch(`${baseUrl}/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient: testPatient._id })
    });
    if (unauthRes.status === 401) {
      console.log('SUCCESS: Unauthenticated request rejected with 401.');
    } else {
      throw new Error(`Expected 401, got ${unauthRes.status}`);
    }

    // -----------------------------------------------------------
    // TEST 14: Non-doctor module verification (Receptionist/Patients)
    // -----------------------------------------------------------
    console.log('\n[TEST 14] Verifying Receptionist/Manager/Doctor patient fetch API intact...');
    const allPatientsRes = await fetch(`${baseUrl}/patients`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    const allPatientsData = await allPatientsRes.json();
    if (allPatientsRes.status === 200 && Array.isArray(allPatientsData.patients)) {
      console.log(`SUCCESS: Patient collection intact. Total patients: ${allPatientsData.patients.length}`);
    } else {
      throw new Error('Failed to fetch patients without filter');
    }

    // Cleanup test patient and remaining record
    console.log('\nCleaning up test data...');
    await MedicalRecord.deleteMany({ patient: testPatient._id });
    await Patient.findByIdAndDelete(testPatient._id);
    console.log('Test patient and records cleaned up.');

    console.log('\n====================================================');
    console.log('ALL 14 END-TO-END TESTS PASSED SUCCESSFULLY! (100%)');
    console.log('====================================================');

  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
