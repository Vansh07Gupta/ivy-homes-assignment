require("dotenv").config();

const fs = require("fs");

async function login() {
  const response = await fetch("https://solve.ivy.homes/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.API_KEY,
    },
    body: JSON.stringify({
      email: process.env.EMAIL,
      password: process.env.PASSWORD,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Login failed: ${response.status} - ${data.detail || "Unknown error"}`
    );
  }

  return data.access_token;
}

async function apiRequest(url, token) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-API-Key": process.env.API_KEY,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} - ${
        data.detail || "Unknown error"
      }`
    );
  }

  return data;
}

async function fetchListings(token, offset) {
  const url = `https://solve.ivy.homes/v1/listings?offset=${offset}&limit=20`;
  return await apiRequest(url, token);
}

async function fetchRentals(token, offset) {
  const url = `https://solve.ivy.homes/v1/rentals?offset=${offset}&limit=20`;
  return await apiRequest(url, token);
}

async function fetchProjects(token, offset) {
  const url = `https://solve.ivy.homes/v1/projects?offset=${offset}&limit=20`;
  return await apiRequest(url, token);
}

async function fetchAllPages(fetchData) {
  const allResults = [];

  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    console.log(`Fetching data with offset ${offset}`);

    const response = await fetchData(offset);

    allResults.push(...response.results);

    hasMore = response.has_more;

    offset += response.limit;
  }

  return allResults;
}

function writeToJSON(filename, data) {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  console.log(`${filename} written successfully`);
  console.log(`${filename} length: ${data.length}`);
}
async function main() {
  if (!process.env.EMAIL || !process.env.PASSWORD || !process.env.API_KEY) {
    throw new Error("Missing EMAIL, PASSWORD, or API_KEY in .env file");
  }

  const token = await login();

  console.log("Login successful");

  const listings = await fetchAllPages((offset) =>
    fetchListings(token, offset)
  );
  writeToJSON("listings.json", listings);

  const rentals = await fetchAllPages((offset) =>
    fetchRentals(token, offset)
  );
  writeToJSON("rentals.json", rentals);

  const projects = await fetchAllPages((offset) =>
    fetchProjects(token, offset)
  );
  writeToJSON("projects.json", projects);
}

main().catch((error) => {
  console.error("Error:", error.message);
});