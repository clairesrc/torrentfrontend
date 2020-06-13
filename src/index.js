const express = require("express")
const Xray = require("x-ray")
const util = require("util")

const app = express()
const port = process.env.APP_PORT || 3000
var x = Xray()
const searchUrl = "https://1337x.to/category-search/%s/Music/1/"
const torrentDetailUrlPrefix = "https://1337x.to/torrent/"

app.use(express.static('public'))

app.get('/search/:search', async (req, res) => res.send(await search(req.params.search)))

app.get('/download/:torrentId/:torrentTitle', async (req, res) => res.send(await download(`${torrentDetailUrlPrefix}/${req.params.torrentId}/${req.params.torrentTitle}`)))

app.listen(port)

async function search(search) {
    return await x(util.format(searchUrl, search), '.table-list tbody tr', [
        {
            title: '.name a:nth-child(2)',
            link: '.name a:nth-child(2)@href'
        }
    ]).paginate('.pagination li.active+li a@href')
}

async function download(download) {
    return await x(download, '.torrent-detail-page li:nth-child(1)', [
        {
            link: 'a@href'
        }
    ]).then((links) => {
        return new Promise((resolve, reject) => {
            exec(`transmission-remote -a "${links[0].link}" -n "transmission:"`, (error, stdOut, stdErr) => {
                if (error) {
                    reject(error)
                    console.error(error)
                }
                if (stdErr) {
                    reject(stdErr)
                    console.error(stdErr)
                }
                if (stdOut.includes("success")) {
                    resolve(`{"success": true}`)
                }
            })
        })
    })
}