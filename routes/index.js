const express = require("express");
const admin = require("firebase-admin");
const serviceAccount = require("./../serviceAccount.json");

const router = express.Router();

let items = [];

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

//Univoque id generator
function genId(items){
    return items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
}

//GET /items
router.get("/items", async (req, res) => {
    const products = [];
    const list = await db.collection('items').get();
    list.forEach(doc => products.push(doc.data()));
    items = products;
    return res.status(200).json(items);
});

//GET /items/:id
router.get("/items/:id", (req, res) => {
    db.collection('items').doc(req.params.id).get().then(
        item => {
            if(!item.exists){
                //res.status(404);
                res.status(404).json(message: "User not found");
            }
            res.status(200).json(item.data());
        }
    ).catch(error => res.status(500).send(error));
});

//POST /items
router.post("/items", (req, res) => {
    const newId = genId(items);
    if(req.body.product){
        let item = {
            id: newId,
            product: req.body.product
        };
        // POST con generazione automatica del nome del doc
        /*db.collection('items').add(item);*/
        // POST con personalizzazione nome doc
        db.collection('items').doc(newId.toString()).set(item);
        return res.status(201).json({message: "Product added"});
    } else {
        return res.status(400).json({message: "Bad request, not a product"});
    }
});

//PATCH /items/:id
router.patch("/items/:id", (req, res) => {
    const item = items.find(val => val.id === Number(req.params.id));

    if(item){
        item.product = req.body.product;
        return res.status(200).json(
            {
                message: "Product updated"
            }
        );
    }else{
        return res.status(404).json(
            {
                message: "Product not found"
            }
        );
    }
});

// //DELETE /items/:id
//Saving the item and retrive the index with indexOf
// router.delete("/items/:id", (req, res) => {
//     const item = items.find(val => val.id === Number(req.params.id));

//     if(item){
//         items.splice(items.indexOf(item), 1);
//         return res.status(200).json(
//             {
//                 message: "Product deleted",
//                 product: item
//             }
//         );
//     }else{
//         return res.status(404).json(
//             {
//                 message: "Product not found"
//             }
//         );
//     }
// });

//DELETE /items/:id
//Save the deleted product before splice because i use indexes
router.delete("/items/:id", (req, res) => {
    const itemIndex = items.findIndex(val => val.id === Number(req.params.id));

    if(itemIndex >= 0){
        let deletedProduct = items[itemIndex];
        items.splice(itemIndex, 1);
        return res.status(200).json(
            {
                message: "Product deleted",
                product: deletedProduct
            }
        );
    }else{
        return res.status(404).json(
            {
                message: "Product not found"
            }
        );
    }
});

module.exports = router;