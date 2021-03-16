'use strict'
const server = require("express")
const pg = require("pg")
const superagent = require("superagent")
const override = require("method-override")
require("dotenv").config()
const app = server()
const port = 1250
app.use(server.static("./public"))
app.set("view engine", "ejs")
app.use(server.urlencoded({ extended: true }))
app.use(override("method"))
// const client = new pg.Client(process.env.DATABASE)
const client = new pg.Client({ connectionString: process.env.DATABASE, ssl: { rejectUnauthorized: false } });
client.connect()
app.listen(port, () => {
    console.log(port);
})
app.get("/", homePage)
app.post("/getCountryResult", resultC)
app.get("/AllCountries", allCountries)
app.post("/saving", saveData)
app.get("/saving", recordes)
app.get("/detail/:id", getID)
app.delete("/detail/:id", deleteData)
app.put("/detail/:id", updateData)
function updateData(req, res) {
    let { country, totalconfirmed, totaldeaths, totalrecovered, date } = req.body
    let Arr = [country, totalconfirmed, totaldeaths, totalrecovered, date]
    client.query(`update Test set country=$1, totalconfirmed=$2, totaldeaths=$3, totalrecovered=$4, date=$5 where id=${req.params.id} returning *`, Arr)
    // .then(result =>{
    //     res.render("pages/detail",{data:result.rows[0]})
    // })
    res.redirect(`/detail/${req.params.id}`)
}
function deleteData(req, res) {
    client.query(`delete from Test where id=${req.params.id}`)
    res.redirect("/saving")
}
function getID(req, res) {
    client.query(`select * from Test where id=${req.params.id}`)
        .then(result => {
            res.render("pages/detail.ejs", { data: result.rows[0] })
        })
}
function recordes(req, res) {
    client.query("select * from Test").then(result => {
        res.render("pages/myRecodes.ejs", { data: result.rows })
    })
}
function saveData(req, res) {
    let { country, totalconfirmed, totaldeaths, totalrecovered, date } = req.body
    let Arr = [country, totalconfirmed, totaldeaths, totalrecovered, date]
    client.query("insert into Test(country,totalconfirmed,totaldeaths,totalrecovered,date) Values($1,$2,$3,$4,$5)", Arr)
    res.redirect("/saving")
}
function allCountries(req, res) {
    let url = "https://api.covid19api.com/summary"
    superagent.get(url).then(result => {
        let Arr = result.body.Countries.map(function (result) {
            let newCountry = new Country(result)
            return newCountry

        })
        // res.send(Arr[0].country)
        res.render("pages/allCountries.ejs", { data: Arr })
    })
}
function Country(data) {
    this.country = data.Country
    this.totalconfirmed = data.TotalConfirmed
    this.totaldeaths = data.TotalDeaths
    this.totalrecovered = data.TotalRecovered
    this.date = data.Date
}
function resultC(req, res) {
    let { q, from, to } = req.body
    let url = `https://api.covid19api.com/country/${q}/status/confirmed?from=${from}T00:00:00Z&to=${to}T00:00:00Z`
    superagent.get(url).then(result => {
        // res.send(result.body[0].Date)
        res.render("pages/getCountryResult", { data: result.body })
    })
}
function homePage(req, res) {
    let url = `https://api.covid19api.com/world/total`

    superagent.get(url).then(result => {
        res.render("pages/homepage", { data: result.body })
     })
}
app.get("*", (req, res) => {
    res.send("Page Not Found")
})
