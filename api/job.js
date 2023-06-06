// When debugging, use Flask on Port 5000
const API_URL = "http://127.0.0.1:5000";
// const API_URL = "https://api.staminachecker.org/"
var uid_global = null;

// Converts the terminal output from the STAMINA docker into some pretty HTML
// Yes, this is hackey
const INFO_HEADER="\u001b[1m\u001b[34m[INFO]: \u001b[0m\u001b[0m";
const MSG_HEADER="\u001b[1m\u001b[32m[MESSAGE]: \u001b[0m\u001b[0m";
const WARN_HEADER="\u001b[1m\u001b[33m[WARNING]: \u001b[0m\u001b[0m";
const ERR_HEADER="\u001b[1m\u001b[31m[ERROR]: \u001b[0m\u001b[0m\u001b[1m";

const BOLD_START = "\u001b[1m";
const BOLD_END = "\u001b[0m";
const PURPLE_START = "\u001b[35m";

const H_LINE="========================================================================================";

// var logs = "";

/**
 * Does some really hackey text-parsing to present some information to the user.
 * 
 * This is so hackey I understand why people make their code proprietary. Please don't think the actual STAMINA codebase is this hackey.
 * */
async function getLogData() {
	console.log("Making request to " + API_URL + "/checkjob" + " for uid: " + uid_global)
	fetch(API_URL + "/checkjob", {
		method:"POST"
		, mode: "cors"
		, body:uid_global // JSON.stringify({id:uid_global})
// 		, headers: {
// 			"Content-Type": "application/json"
// 		}
	}).then((response) => response.text()
		.then((text) => {
			// console.log(text)
			let out = document.getElementById("output");
			out.innerHTML = "";
// 			logs = text;
			let saveLogs = document.getElementById("save-logs");
			var logFile = new Blob([text], {type:"text/plain"});
			saveLogs.href = URL.createObjectURL(logFile);
			saveLogs.download = "stamina_logs_" + uid_global + ".txt"
			text.split("\n").forEach(t => {
// 				console.log(t);
				// This is an "info" text
				if (t.startsWith(INFO_HEADER)) {
					out.innerHTML += "<span class=info>"
					+ t.replace(INFO_HEADER, "")
					+ "</span>";
				}
				// This is a "good" msg text
				else if (t.startsWith(MSG_HEADER)) {
					out.innerHTML += "<span class=good>"
					+ t.replace(MSG_HEADER, "")
					+ "</span>";
					// I should probably do something a little better this.
					// This is really hackey
					if (t.includes("Finished running!")) {
						document.getElementById("status").innerHTML = "Finished";
					}
				}
				else if (t.startsWith(WARN_HEADER) || t.includes("WARN")) {
					out.innerHTML += "<span class=warn>"
					+ t.replace(WARN_HEADER, "").replace("WARN", "")
					+ "</span>";
				}
				else if (t.startsWith(ERR_HEADER)) {
					out.innerHTML += "<span class=err>"
					+ t.replace(ERR_HEADER, "")
					+ "</span>";
					if (t.includes("exit")) {
						document.getElementById("status").innerHTML = "Exited with error";
					}
				}
				else if (t == H_LINE) {
					out.innerHTML += "<span class=hline></span>"
				}
				else if (t == "Killed.")
				{
					document.getElementById("status").innerHTML = "Killed (by user or by timeout)";
					out.innerHTML += "<span class=\"err killed\">"
					+ t
					+ "</span>";
				}
				else {
					if (t.trim() == "") { return; }
					out.innerHTML += "<span class=line>" 
					// This is soo hacky
					+ t.replace(BOLD_START + PURPLE_START, "<b><span style='color:#bb1cbb'>")
						.replace(BOLD_END + BOLD_END, "</span></b>")
						.replace(BOLD_START, "<b>")
						.replace(BOLD_END, "</b>")
					+ "</span>";
// 					console.log(t);
					if (t.includes("Probability Minimum:")) {
						console.log(t);
						var tToAdd = t.replace("Probability Minimum:", "").replaceAll(BOLD_END, "").replace(PURPLE_START, "").replace(BOLD_START, "");
						console.log(tToAdd);
						document.getElementById("pmin").innerHTML = tToAdd;
						document.querySelectorAll(".results").forEach(t => t.style.display = "block");
					}
					else if (t.includes("Probability Maximum:")) {
						document.getElementById("pmax").innerHTML = t.replace("Probability Maximum:", "").replaceAll(BOLD_END, "").replace(PURPLE_START , "").replace(BOLD_START, "");
					}
					else if (t.includes("Window:")) {
						document.getElementById("w").innerHTML = t.replace("Window:", "").replace(BOLD_END, "");
					}
				}
			});
		}));
	let now = new Date();
	document.getElementById("check-time").innerHTML = now.toLocaleString();
}

async function getMyJobs() {
	console.log("Making request to " + API_URL + "/myjobs");
	fetch(API_URL + "/myjobs", {
		method:"GET"
	}
	).then((response) => response.json()
		.then((json) => {
			console.log(json);
			let jobs = document.getElementById("jobs");
			jobs.innerHTML = "";
			if ("error" in json) {
				jobs.innerHTML += "<div class=error>Got the following error when attempting to access jobs:<br>"
				+ json["error"] + "</div>";
			}
			else {
				json.forEach((job) => {
					let jobKilled = job.status == "killed";
					let jobExited = job.status == "exited";
					var addlClass = "";
					if (jobKilled || jobExited) {
						addlClass = "disabled";
					}
					jobs.innerHTML += "<div class=job>"
					// Job name
					+ "<h2 id=job-name-" + job.uid + ">" + job.name 
					+ "<span onclick=requestRenameJob('" + job.uid + "')><i class=\"clickable-icon icon icon_document-edit\"></i></span>"
					+ "</h2>"
					// UID
					+ "<div>UID: " + job.uid + "</div>"
					// Status
					+ "<div>Status: " + job.status + "</div>"
					// Pmin and Pmax, if applicable
					+ getPminPmaxIfApplicable(job)
					// View Button
					+ "<a class=button-small href=job.html?uid=" + job.uid + " target=_blank rel=\"noopener noreferrer\">View</a>"
					// Kill Button
					+ "<a class=\"button-small-error " + addlClass + "\" onclick='killJob(\"" + job.uid + "\")' id=kill-job-" + job.uid + ">Kill</a>"
					+ "</div>";
				});
			}
		}));
	let now = new Date();
	document.getElementById("check-time").innerHTML = now.toLocaleString();
}

/**
 * Sends an HTTP request to the /kill endpoint for the STAMINA to stop
 * a job with a certain UID.
 * */
function killJob(uid) {
	fetch(API_URL + "/kill", {
		method: "POST"
		, mode: "cors"
		, body: uid
	}).then((response) => response.text()
		.then((text) => {
			console.log(text);
			// Should really do some kind of flag here
			if (text == "Success") {
				let btn = document.getElementById("kill-job-"+uid);
				btn.classList.add("disabled");
				btn.onclick = "";
			}
	}));
}

/**
 * Sends an HTTP request to the /rename endpoint for STAMINA to rename a job
 * with a certain UID.
 * */
function renameJob(uid, newName) {
	fetch(API_URL + "/rename", {
		method: "POST"
		, mode: "cors"
// 		, headers: new Headers({
// 			"Content-Type": "application/json"
// 			, "Access-Control-Allow-Origin":"*"
// 			, "Access-Control-Allow-Headers": "*"
// 		})
		, body: JSON.stringify({
			id: uid
			, name: newName
		})
	}).then((response) => {
		if (response.status == 200) {
			document.getElementById("job-name-" + uid).innerHTML = newName;
		}
		else {
			alert("Got status \"" + response.status + "\" when trying to rename Job!");
		}
	});
}

function requestRenameJob(uid) {
	let name = prompt("New name for job:");
	renameJob(uid, name);
}

function getPminPmaxIfApplicable(job) {
	var toReturn = "";
	var pMin = null;
	var pMax = null;
	job.logs.split("\n").forEach((line) => {
		if (line.includes("Probability Minimum:")) {
			pMin = line.replace("Probability Minimum:", "")
					.replaceAll(BOLD_END, "")
					.replace(PURPLE_START, "")
					.replace(BOLD_START, "");
		}
		else if (line.includes("Probability Maximum:")) {
			pMax = line.replace("Probability Maximum:", "")
					.replaceAll(BOLD_END, "")
					.replace(PURPLE_START, "")
					.replace(BOLD_START, "");
		}
	});
	if (pMin != null) {
		toReturn += "<div>P<sub>min</sub>:" + pMin + "</div>";
	}
	if (pMax != null) {
		toReturn += "<div>P<sub>max</sub>:" + pMax + "</div>";
	}
	return toReturn;
}
