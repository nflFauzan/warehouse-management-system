const CustomerRepository = require('../repositories/CustomerRepository');

class CustomerService {
  async getCustomers(query) {
    const { search, page = 1 } = query;
    const limit = 20;
    const offset = (page - 1) * limit;

    const { count, rows: customers } = await CustomerRepository.findAndCountAll({
      search,
      limit,
      offset
    });

    return {
      customers,
      count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit)
    };
  }

  async getCustomerById(id) {
    return await CustomerRepository.findById(id);
  }

  async createCustomer(data) {
    return await CustomerRepository.create(data);
  }

  async updateCustomer(id, data) {
    return await CustomerRepository.update(id, data);
  }

  async deleteCustomer(id) {
    return await CustomerRepository.softDelete(id);
  }
}

module.exports = new CustomerService();
