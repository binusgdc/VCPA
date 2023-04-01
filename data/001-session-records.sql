--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

create table `session` (
    `owner_id` varchar(19) not null,
    `guild_id` varchar(19) not null,
    `channel_id` varchar(19) not null,
    `start_time` datetime not null,
    `end_time` datetime not null,
    primary key (`guild_id`, `channel_id`)
);

create table `event` (
    `count` int not null,
    `session_guild_id` varchar(19) not null,
    `session_channel_id` varchar(19) not null,
    `time_occurred` datetime not null,
    `event_code` varchar(10) not null,
    `user_id` varchar(19) not null, 
    primary key (`count`, `session_guild_id`, `session_channel_id`),
    foreign key (`session_guild_id`, `session_channel_id`) references `session`(`guild_id`, `channel_id`)
);