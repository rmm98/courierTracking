create database courier;
use courier;

create table admin(
    email varchar(30) primary key,
    password varchar(20)
);
insert into admin values("email@gmail","admin");

create table user(
    name varchar(20),
    phone varchar(10),
    address varchar(50),
    branch varchar(20),
    email varchar(30) primary key,
    password varchar(20)
);

create table orderDetails(
	orderId varchar(5) primary key,
    clientName varchar(20),
    source varchar(20),
    destination varchar(20),
    current_location varchar(20),
    priority varchar(20),
    estimated_time varchar(20),
    qrcode varchar(1500),
    email varchar(30)
);