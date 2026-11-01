//Author: Trevor Ceaser
import {useState} from "react";
import type {SubmitEvent} from "react";

function AddListing() {
    const[title, setTitle] = useState<string>("")
    const[price, setPrice] = useState<string>("")
    const[description, setDescription] = useState<string>("")
    const[pickuplocation, setPickupLocation] = useState<string>("")
    const[category, setCategory] = useState<string>("")
    const[photo, setPhoto] = useState<File | null>(null)

    function handleAddListing(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault()
        alert("'Submit' in progress")
    }

    return (
        <form onSubmit={handleAddListing}>
            <h1>Create a Listing</h1>
            <div>
                <label htmlFor="title">Item Title:</label>
                <input
                    id="title"
                    type="text"
                    value={title}
                    placeholder="Enter a title"
                    onChange={(event) => setTitle(event.target.value)}
                />
            </div>

            <div>
                <label htmlFor="photo">Display your Item:</label>
                <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                    const selectedFile = event.target.files?.[0] ?? null
                    setPhoto(selectedFile)
                }}
                />
                {photo && <p>Selected File: {photo.name}</p>}
            </div>

            <div>
                <label htmlFor="price">Item Price:</label>
                <input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                />
            </div>

            <div>
                <label htmlFor="pickuplocation">Pickup Location:</label>
                <input
                    id="pickuplocation"
                    type="text"
                    value={pickuplocation}
                    placeholder="Enter a pickup location"
                    onChange={(event) => setPickupLocation(event.target.value)}
                />
            </div>


            <div>
                <label htmlFor="description">Item Description:</label>
                <textarea
                    id="description"
                    value={description}
                    placeholder="Give a description of your item"
                    onChange={(event) => setDescription(event.target.value)}>
                </textarea>
            </div>

            <div>
                <label htmlFor="category">Category:</label>
                <select
                    id="category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}>
                    <option value="" disabled>Select a category for your item</option>
                    <option value="Tailgate Ready">Tailgate Ready</option>
                    <option value="Back to School">Back to School</option>
                    <option value="Move-In Day">Move In Day</option>
                    <option value="Move-Out Day">Move-Out Day</option>
                </select>
            </div>
            <button type="submit">Add Listing</button>
        </form>
    );
}
export default AddListing;