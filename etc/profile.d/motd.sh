#!/bin/bash
clear
echo -e "\e[38;5;6m\
         .:kXWMMMWKkdolcclkMMMM:        
        ;WMMMXx?'''        KMMM:        
        :MMN'              xMMM.        
        .WMMc             :0MMM         
         dMMW;      ,     :WMMM         
         .NMMWxdxkK0;     'NMMM.        
          cMMMMWKx;:      'kMMM.        
           :lNNl''   ,     oMMM:        
                  .oK;     xMMM,        
              .unWMNc     .NMMd         
\e[0m\
R+R $( cat /srv/http/data/system/version )"
printf "\e[38;5;8m%*s\e[0m\n" $( tput cols ) | tr ' ' -
