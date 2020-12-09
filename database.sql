create user exbounce@localhost;
create schema exbounce;

grant all privileges on exbounce.* to exbounce@localhost;
use exbounce;

create table log (
  code varchar(10) not null,
  ip varchar(30) not null,
  method varchar(30) not null,
  host text not null,
  headers text,
  body text,
  target text,
  onssl boolean,
  blocked boolean,
  logAt timestamp default current_timestamp not null
);

create table blacklist (
  ip varchar(30) not null,
  reason text not null,
  blockat timestamp default current_timestamp not null
);
