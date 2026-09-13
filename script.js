
require("dotenv").config();

const fs = require("fs");

async function login() {
    const response = await fetch(
        "https://solve.ivy.homes/auth/login",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": process.env.API_KEY
            },
            body: JSON.stringify({
                email: process.env.EMAIL,
                password: process.env.PASSWORD
            })
        }
    );
    const data = await response.json();
    if (!response.ok) {
        throw new Error(
            `Login failed: ${response.status} - ${data.detail}`
        );
    }
    return data.access_token;
}
async function apiRequest(url, token) {

    const response = await fetch(url, {
        method: "GET",

        headers: {
            "Authorization": `Bearer ${token}`,
            "X-API-Key": process.env.API_KEY
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            `API Error: ${response.status} - ${data.detail}`
        );
    }

    return data;
}

async function fetchListings(token, page) {

    const url =
        `https://solve.ivy.homes/v1/listings?page=${page}&limit=20`;

    return await apiRequest(url, token);
}


async function fetchRentals(token, page) {

    const url =
        `https://solve.ivy.homes/v1/rentals?page=${page}&limit=20`;

    return await apiRequest(url, token);
}


async function fetchProjects(token, page) {

    const url =
        `https://solve.ivy.homes/v1/projects?page=${page}&limit=20`;

    return await apiRequest(url, token);
}

async function fetchAllPages(fetchPage) {

    const allResults = [];
    const firstPage = await fetchPage(1);
    allResults.push(...firstPage.results);

    const limit = firstPage.page_size;
    const totalPages = Math.ceil(
        firstPage.total / limit
    );

    console.log(`Total pages: ${totalPages}`);

    for (let page = 2; page <= totalPages; page++) {

        console.log(`Fetching page ${page}/${totalPages}`);

        const response = await fetchPage(page);

        allResults.push(...response.results);
    }

    return allResults;
}

function writeToJSON(filename, data) {

    fs.writeFileSync(
        filename,
        JSON.stringify(data, null, 2)
    );

    console.log(`${filename} written successfully`);
}
async function main() {

    if (
        !process.env.EMAIL ||
        !process.env.PASSWORD ||
        !process.env.API_KEY
    ) {
        throw new Error(
            "Missing EMAIL, PASSWORD, or API_KEY in .env"
        );
    }
    console.log("Logging in...");
    const token = await login();
    console.log("Login successful");
    console.log("Fetching listings...");
    const listings = await fetchAllPages(
        (page) => fetchListings(token, page)
    );
    writeToJSON("listings.json", listings);
    console.log("Fetching rentals...");
    const rentals = await fetchAllPages(
        (page) => fetchRentals(token, page)
    );
    writeToJSON("rentals.json", rentals);
    console.log("Fetching projects...");
    const projects = await fetchAllPages(
        (page) => fetchProjects(token, page)
    );
    writeToJSON("projects.json", projects);
    console.log("All data pulled successfully");
}

main().catch((error) => {
    console.error("Error:", error.message);
});