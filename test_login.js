
import axios from 'axios';

const testLogin = async () => {
    try {
        console.log("Testing Login...");
        const res = await axios.post('http://localhost:5000/api/admin/login', {
            email: 'Admin6@gmail.com',
            password: 'Admin666'
        });
        console.log("✅ SUCCESS:", res.data);
    } catch (error) {
        if (error.response) {
            console.log("❌ FAILED (Server Responded):", error.response.data);
        } else {
            console.log("❌ FAILED (Network Error):", error.message);
        }
    }
};

testLogin();
