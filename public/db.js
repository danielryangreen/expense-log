let db;

// create a new db request
const request = indexedDB.open("expenseLog", 1);

// create schema
request.onupgradeneeded = function(event) {
  const db = event.target.result;
  db.createObjectStore("expenses", { autoIncrement: true });
};

// check if app is online and write offline storage to database
request.onsuccess = function(event) {
  db = event.target.result;

  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function(event) {
  console.log(event.target.errorCode);
};

// helper function to save transaction to offline storage
function saveRecord(record) {
  const transaction = db.transaction(["expenses"], "readwrite");
  const store = transaction.objectStore("expenses");
  store.add(record);
}

// check for records in offline storage, write to database, and empty offline storage
function checkDatabase() {
  const transaction = db.transaction(["expenses"], "readwrite");
  const store = transaction.objectStore("expenses");
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json())
      .then(() => {
        const transaction = db.transaction(["expenses"], "readwrite");
        const store = transaction.objectStore("expenses");
        store.clear();
      });
    }
  };
}

// listen for app coming back online and write offline storage to database
window.addEventListener("online", checkDatabase);
