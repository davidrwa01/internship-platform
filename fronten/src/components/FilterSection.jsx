 
// Filter companies with safety check
const filteredCompanies = Array.isArray(companies) 
  ? companies.filter((company) => {
      const byLocation = locationFilter === "all" || company.location === locationFilter;
      const byDepartment =
        departmentFilter === "all" ||
        company.trainings?.some((t) =>
          t.toLowerCase().includes(departmentFilter.toLowerCase())
        );
      return byLocation && byDepartment;
    })
  : [];

// Filter internships with safety check
const filteredInternships = Array.isArray(internships)
  ? internships.filter((internship) => {
      const byLocation = locationFilter === "all" || internship.location === locationFilter;
      const byDepartment = departmentFilter === "all" || internship.department === departmentFilter;
      return byLocation && byDepartment;
    })
  : [];