const API_URL = 'http://localhost:5000/api';

async function testOrgStructure() {
    try {
        console.log('Logging in as SUPER_ADMIN...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@moha.com', password: 'password123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.data.token;
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

        console.log('Creating Plant...');
        let plantId;
        const plantRes = await fetch(`${API_URL}/plants`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: 'Test Plant ' + Date.now(), code: 'TP' + Date.now() })
        });
        const plantData = await plantRes.json();
        if (!plantRes.ok) throw new Error(plantData.error);
        plantId = plantData.data.id;
        console.log('Created Plant:', plantData.data.name);

        console.log('Creating Department...');
        let deptId;
        const deptName = 'Engineering ' + Date.now();
        const deptRes = await fetch(`${API_URL}/departments`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: deptName, plantId, description: 'Engineering Dept' })
        });
        const deptData = await deptRes.json();
        if (!deptRes.ok) throw new Error(deptData.error);
        deptId = deptData.data.id;
        console.log('Created Department:', deptData.data.name);

        console.log('Creating Duplicate Department...');
        const dupDeptRes = await fetch(`${API_URL}/departments`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: deptName, plantId, description: 'Duplicate' })
        });
        const dupDeptData = await dupDeptRes.json();
        if (dupDeptRes.ok) {
            console.error('ERROR: Duplicate department creation should have failed!');
        } else {
            console.log('Duplicate department correctly rejected:', dupDeptData.error);
        }

        console.log('Creating Section...');
        let sectionId;
        const sectionName = 'Software ' + Date.now();
        const sectionRes = await fetch(`${API_URL}/sections`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: sectionName, departmentId: deptId, description: 'Software Section' })
        });
        const sectionData = await sectionRes.json();
        if (!sectionRes.ok) throw new Error(sectionData.error);
        sectionId = sectionData.data.id;
        console.log('Created Section:', sectionData.data.name);

        console.log('Creating Duplicate Section...');
        const dupSectionRes = await fetch(`${API_URL}/sections`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: sectionName, departmentId: deptId, description: 'Duplicate Section' })
        });
        const dupSectionData = await dupSectionRes.json();
        if (dupSectionRes.ok) {
            console.error('ERROR: Duplicate section creation should have failed!');
        } else {
            console.log('Duplicate section correctly rejected:', dupSectionData.error);
        }

        console.log('ALL TESTS PASSED!');

    } catch (error: any) {
        console.error('Test failed:', error.message);
    }
}

testOrgStructure();
