"use strict";import _ from"lodash";import got from"got";import randomMobileUA from"./ua.js";import shouldCompress from"./scomp.js";import redirect from"./rd.js";import compress from"./comp.js";import copyHeaders from"./copyH.js";import{CookieJar}from"tough-cookie";const cookieJar=new CookieJar;const{pick}=_;export default async function proxy(req,res){const clientIP=req.headers["x-forwarded-for"]||req.ip;if(["127.0.0.1","::1"].includes(clientIP)){return redirect(req,res)}try{const gotoptions={headers:{...pick(req.headers,["cookie","dnt","referer","range"]),"user-agent":randomMobileUA()},maxRedirects:4,followRedirect:false,https:{rejectUnauthorized:false},cookieJar:cookieJar,timeout:{response:6600},decompress:true};let origin=await got.stream(req.params.url,gotoptions);origin.on("response",originResponse=>{if(originResponse.statusCode>=400)return redirect(req,res);if(originResponse.statusCode>=300&&originResponse.headers.location)return redirect(req,res);copyHeaders(originResponse,res);res.setHeader("content-encoding","identity");res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Cross-Origin-Resource-Policy","cross-origin");res.setHeader("Cross-Origin-Embedder-Policy","unsafe-none");req.params.originType=originResponse.headers["content-type"]||"";req.params.originSize=originResponse.headers["content-length"]||"0";origin.on("error",()=>req.socket.destroy());if(shouldCompress(req)){return compress(req,res,origin)}else{res.setHeader("x-proxy-bypass",1);for(const headerName of["accept-ranges","content-type","content-length","content-range"]){if(headerName in originResponse.headers)res.setHeader(headerName,originResponse.headers[headerName])}return origin.pipe(res)}})}catch(err){if(err.code==="ERR_INVALID_URL"){return res.status(400).send("Invalid URL")}redirect(req,res);console.error(err)}}