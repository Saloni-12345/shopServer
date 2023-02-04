const {Client} = require("pg");
const client = new Client({
 user:"postgres",
 host:"db.eyzlslzfvanhmztlwcls.supabase.co",
 password:"Saloni@1231",
 database:"postgres",
 port:"5432",
 ssl:{ rejectUnauthorized:false },
});
client.connect(function(res,error){
  console.log(`Connected!!!`)
})

let express = require("express");
let app = express();
app.use(express.json());
app.use(function(req,res,next){
res.header("Access-Control-Allow-Origin","*");
res.header("Access-Control-Allow-Methods",
"GET,POST,OPTIONS,PUT,PATCH,DELETE,HEAD");
res.header("Access-Control-Allow-Headers",
"Origin,X-Requested-With,Content-Type,Accept");
next();
});
let port = process.env.PORT||2410;
app.listen(port,()=>console.log(`Node app listening on port ${port}!`));

makeString=(query)=>{
   let {shop,product}=query;
   let count = 0;
   let brd = product?(makeArr(product,"productid",count)):"";
   count+=product?product.split(",").length:count;
  let searchStr ="";
  searchStr = product?addTo(searchStr,brd):addToStr(searchStr,"productid",product,count+1);
  searchStr = addToStr(searchStr,"shopid",shop,count+1);
  return searchStr;
  }
  addToStr=(str,pname,pval,count)=>
  pval?str?str+" AND "+pname+"=$"+count:pname+"=$"+count:str;
  addTo=(str,pval)=>
  pval?str?str+" AND ("+pval+")":"("+pval+")":str;
  
  makeArr=(param,pname,count)=>{
      let arr = param.split(",")
      let str=""
      for(let i=0;i<arr.length;i++){
       str=addQry(str,pname,arr[i],count+1)
       count ++;
      }
      return str;
}
addQry=(str,pname,pval,con)=>
pval?str?str+" OR "+pname+"=$"+con:pname+"=$"+con:str;
  
  makeArrString=(query)=>{
      let {shop,product}=query;
      let searchStr ="";
      searchStr = addStr(searchStr,product);
      searchStr = addStr(searchStr,shop);
         return searchStr;
  }
  addStr=(str,pval)=>
   pval?str?str+","+pval:pval:str;
  
app.get("/shops",function(req,res,next){
 let qry = `select * from shops`;
 client.query(qry,function(err,results){
    if(err) res.status(404).send(err);
    res.send(results.rows)
 })
})
app.post("/shops",function(req,res,next){
   let body = req.body;
   let values = Object.values(body);
   let qry = `insert into shops(name,rent) values($1,$2)`;
   client.query(qry,values,function(err,result){
      if(err) res.status(404).send(err);
      res.send(result.rowCount+" Data Successfully Inserted!");
   })
})
app.get("/products",function(req,res,next){
    let qry = `select * from products`;
    client.query(qry,function(err,results){
       if(err) res.status(404).send(err);
       res.send(results.rows)
    }) 
})
app.get("/products/:productid",function(req,res){
 let id = req.params.productid;
 let qry = `select * from products where productid=$1`;
 client.query(qry,[id],function(err,result){
   if(err) res.status(404).send(err);
   let data = result.rows
   res.send(data[0]);
 })
})
app.post("/products",function(req,res,next){
   let body = req.body;
   let values = Object.values(body);
   let qry = `insert into products(productname,category,description) values($1,$2,$3)`;
   client.query(qry,values,function(err,result){
      if(err) res.status(404).send(err);
      res.send(result.rowCount+" Data Successfully Inserted!");
   })
})
app.put("/products/:productid",function(req,res){
 let id = req.params.productid;
 let body = req.body;
 let values = [body.productname,body.category,body.description,id];
 let qry = `update products set productname=$1, category=$2, description=$3 where productid=$4`;
 client.query(qry,values,function(err,result){
   if(err) res.status(404).send(err);
   res.send(result.rowCount+" Data Updatedd Successfully!");
 })
})
app.get("/purchases",function(req,res,next){
let qry = `select * from purchases`;
let shop = req.query.shop;
let product = req.query.product;
let sort = req.query.sort;
let sortby = sort?sort=="QtyAsc"?"quantity asc":
sort=="QtyDesc"?"quantity desc":sort=="ValueAsc"?"quantity*price asc":
sort=="ValueDesc"?"quantity*price desc":"":"";
let values = "";
let queries={shop,product}
//console.log(makeString(queries))
 if(shop||product){
   if(sort){ qry = `SELECT * FROM purchases WHERE ${makeString(queries)} ORDER BY ${sortby} `;
    values = makeArrString(queries).split(",");
  }else{
    qry = `SELECT * FROM purchases WHERE ${makeString(queries)} `;
    values = makeArrString(queries).split(",");
  }
 }else if(sort){
    qry = `SELECT * FROM purchases ORDER BY ${sortby} `;
 }
 if(values){
  client.query(qry,values,function(err,result){
    if(err) {res.status(404).send(err)}
    res.send(result.rows);
 })
 }else{
    client.query(qry,function(err,results){
       if(err) res.status(404).send(err);
       res.send(results.rows)
    }) 
   }
});
app.post("/purchases",function(req,res){
 let body = req.body;
 let values = Object.values(body);
 let qry = `insert into purchases(shopid,productid,quantity,price) values($1,$2,$3,$4)`;
 client.query(qry,values,function(err,result){
   if(err) res.status(404).send(err);
   res.send(result.rowCount+" Data Successfully Inserted!");
 })
})
app.get("/totalPurchase/shop/:shopid",function(req,res){
let id = req.params.shopid;
let qry=`select productid as id ,sum(quantity*price) as total from purchases where shopid=$1 group by productid`;
client.query(qry,[id],function(err,result){
   if(err) res.status(404).send(err);
   res.send(result.rows);
}); 
})
app.get("/totalPurchase/product/:productid",function(req,res){
   let id = req.params.productid;
   let qry=`select shopid as id ,sum(quantity*price) as total from purchases where productid=$1 group by shopid`;
   client.query(qry,[id],function(err,result){
      if(err) res.status(404).send(err);
      res.send(result.rows);
}); 
})
app.get("/purchases/shops/:shopid",function(req,res){
   let id = req.params.shopid;
   let qry = `select * from purchases where shopid=$1`;
  client.query(qry,[id],function(err,result){
   if(err) res.status(404).send(err);
   res.send(result.rows);
  })
});
app.get("/purchases/products/:productid",function(req,res){
 let id = req.params.productid;
 let qry = `select * from purchases where productid=$1`;
 client.query(qry,[id],function(err,result){
   if(err) res.status(404).send(err);
   res.send(result.rows);
 })
})
