--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

create table `session` (
    `id` varchar(19) not null,
    `owner_id` varchar(19) not null,
    `guild_id` varchar(19) not null,
    `channel_id` varchar(19) not null,
    `time_started` datetime not null,
    `time_ended` datetime not null,
    `time_stored` date not null,
    `time_pushed` date null default null,
    primary key (`id`),
    unique(`guild_id`, `channel_id`, `time_started`)
);

create table `event` (
    `count` int not null,
    `session_id` varchar(19) not null,
    `time_occurred` datetime not null,
    `event_code` varchar(10) not null,
    `user_id` varchar(19) not null, 
    primary key (`count`, `session_id`),
    foreign key (`session_id`) references `session`(`id`)
);
