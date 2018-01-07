/**
 * Created by StarkX on 07-Jan-18.
 */
const fs = require('fs');
const multer = require('multer');
const loki = require('lokijs');

const upload = multer({ dest : xConfig.uploads.dir });
const db = new loki(`${xConfig.uploads.dir}/${xConfig.uploads.dbName}`, { persistenceMethod : 'fs' });

const getCollection = (name) => {
    "use strict";
    return new Promise((resolve, reject) => {
        db.loadDatabase({}, () => {
            const _collection = db.getCollection(name) || db.addCollection(name);
            resolve(_collection);
        })
    });
};

const saveToDb = (collectionName, nameMapping) => {
    "use strict";
    return getCollection(collectionName)
        .then((collection) => {
            nameMapping.forEach((name) => {
                collection.insert({ id : name.message._id.toString(), fileName : name.fileName });
            });
            db.saveDatabase();
        });
};

const save = (tag) => {
    return upload.array(tag, xConfig.uploads.simultaneousFileLimit);
};

const getPath = (collectionName, id) => {
    return getCollection(collectionName)
        .then((collection) => {
            let row = collection.find({ id : id });
            if (row) {
                row = row[ 0 ];
                return [ `${xConfig.uploads.dir}${row.id}`, row.fileName ];
            }
            return [];
        });
};

module.exports = {
    save : save,
    saveToDb : saveToDb,
    getPath : getPath
};
