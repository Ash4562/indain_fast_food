const Service = require("../../models/shop/Service");
const shopAuthModel = require("../../models/shop/shopAuthModel");


exports.createService = async (req, res) => {
  try {
    const { name, shopId } = req.body;
    const image = req.file?.path;

    if (!name || !shopId) {
      return res.status(400).json({ message: 'Name and shopId are required' });
    }

    const newService = new Service({ name, image, shopId });
    await newService.save();

    res.status(201).json({ message: 'Service created', service: newService });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createServicebyadmin = async (req, res) => {
  try {
    const { name } = req.body;
    const image = req.file?.path;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const existingService = await Service.findOne({ name });
    if (existingService) {
      return res.status(409).json({ message: 'Service already exists' });
    }

    const newService = new Service({ name, image });
    await newService.save();

    res.status(201).json({ message: 'Service created', service: newService });
  } catch (err) {
    console.error('Create Service Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


exports.getAllServicesofAllshop = async (req, res) => {
  try {
    const services = await Service.find()
      .populate('shopId', 'hotelName locations hotelImage') // Populate specific shop fields
      .sort({ createdAt: -1 });

    res.status(200).json(services);
  } catch (err) {
    console.error('Error fetching all shop services:', err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const { serviceId } = req.params;
    if (!serviceId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid serviceId format' });
    }

    const service = await Service.findById(serviceId)
      .populate('shopId', 'hotelName locations hotelImage'); // Populate specific shop fields

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.status(200).json(service);
  } catch (err) {
    console.error('Error fetching service by ID:', err);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
};
                                                                                                                                                                                                                                                                

exports.getAllServices = async (req, res) => {
  try {
    const { shopId } = req.params;

    if (!shopId) {
      return res.status(400).json({ error: 'Shop ID is required' });
    }

    const services = await Service.find({ shopId })
      .populate('shopId', 'hotelName locations hotelImage hotelAddress') // <-- Populating specific fields
      .sort({ createdAt: -1 });

    res.status(200).json(services);
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const image = req.file?.path;

    const service = await Service.findById(id);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    if (name) service.name = name;
    if (image) service.image = image;

    await service.save();
    res.status(200).json({ message: 'Service updated', service });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update service' });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    await Service.findByIdAndDelete(id);
    res.status(200).json({ message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
};

exports.getShopsByServiceName = async (req, res) => {
  try {
    const { categoriesName } = req.params;

    if (!categoriesName) {
      return res.status(400).json({ error: 'categories name is required' });
    }


    const matchedServices = await Service.find({ name: categoriesName });

    if (matchedServices.length === 0) {
      return res.status(404).json({ message: 'No categories found with this name' });
    }


    const shopIds = [...new Set(matchedServices.map(service => service.shopId))];


    const shops = await shopAuthModel.find({ _id: { $in: shopIds } });

    res.status(200).json({ shops });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};


exports.addProductToService = async (req, res) => {
  try {
    const {
      serviceId,
      shopId,
      name,
      description,
      price,
      preparationTime,
      foodCategory,
      available
    } = req.body;

    const image = req.file?.path;

    if (!serviceId ||!shopId|| !name || !description || !price || !preparationTime) {
      return res.status(400).json({ message: "All fields are required" });
    }

 
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

   
    service.products.push({
      name,
      description,
      price,
      preparationTime,
      foodCategory,
      available,
      image
    });

    // ✅ Save updated service
    await service.save();

    res.status(200).json({ message: "Product added", service });
  } catch (error) {
    console.error("Add product error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
