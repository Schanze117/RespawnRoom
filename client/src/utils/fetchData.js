import {API_BASE_URL} from './API/api.js';

// Fetches the list of genres from the API and returns them as an array of objects.
const fetchData = async (games) => {
    try{
        const response = await fetch (`${API_BASE_URL}/${games}`, {
            method: "POST",
            headers:{
                "Content-type": "application/json",
            },
        });
        if (!response.ok){
            throw new Error (`API Error: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    }catch(error){
        console.error("error fetching data:", error);
        return null;
    }
};

// Fetches the list of genres from the API and returns them as an array of objects.
const fetchItem = async () =>{
    const item = await fetchData(API_BASE_URL); 
    if(item) {
        console.log('Name:', item.name);
        console.log("Genre:", item.genre);
        console.log("Description:", item.description);
        console.log("Photo URL:", item.photo);
    }else{
        console.log('No data found.');
    }
};

fetchItem();