const express = require('express');
const { createAddress, getUserAddresses, getAllUsers, updateAddress, deleteAddress } = require('../../controller/user/userAddressController');
const router = express.Router();


router.post('/add',createAddress );

router.get('/get/:userId',getUserAddresses);
router.get('/getall',getAllUsers);
router.put('/update/:addressId',updateAddress);
router.delete('/delete/:addressId',deleteAddress);

module.exports = router;
