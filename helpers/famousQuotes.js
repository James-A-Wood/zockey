/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



define(
        [
            "jquery"
        ],
        function ($) {


            return function ($element) {


                if (!$element) {
                    console.log("famousQuotes requires a jQuery reference to an element to hold the quote!");
                    return false;
                }


                $element.css({opacity: 0});


                var quotes = [
                    ["Strive not to be a success, but rather to be of value.", "Albert Einstein"],
                    ["I attribute my success to this: I never gave or took any excuse.", "Florence Nightingale"],
                    ["You miss 100% of the shots you don’t take.", "Wayne Gretzky"],
                    ["I’ve missed more than 9000 shots in my career. I’ve lost almost 300 games. I’ve failed over and over and over again in my life. And that is why I succeed.", "Michael Jordan "],
                    ["The most difficult thing is the decision to act, the rest is merely tenacity.", "Amelia Earhart "],
                    ["Life is what happens to you while you’re busy making other plans.", "John Lennon"],
                    ["Life is 10% what happens to me and 90% of how I react to it.", "Charles Swindoll"],
                    ["The mind is everything. What you think you become.", "Buddha"],
                    ["The best time to plant a tree was 20 years ago. The second best time is now.", "Chinese proverb"],
                    ["Eighty percent of success is showing up.", "Woody Allen"],
                    ["Your time is limited, so don’t waste it living someone else’s life.", "Steve Jobs"],
                    ["Whether you think you can or you think you can’t, you’re right.", "Henry Ford"],
                    ["The two most important days in your life are the day you are born and the day you find out why.", "Mark Twain"],
                    ["Go confidently in the direction of your dreams.  Live the life you have imagined.", "Henry David Thoreau"],
                    ["Believe you can and you’re halfway there.", "Theodore Roosevelt"],
                    ["Start where you are. Use what you have.  Do what you can.", "Arthur Ashe"],
                    ["Fall seven times and stand up eight. ", "Japanese proverb"],
                    ["Happiness is not something readymade.  It comes from your own actions.", "Dalai Lama"],
                    ["If you’re offered a seat on a rocket ship, don’t ask what seat! Just get on.", "Sheryl Sandberg"],
                    ["Challenges are what make life interesting and overcoming them is what makes life meaningful.", "Joshua J. Marine"],
                    ["A man is a success if he gets up in the morning and goes to bed at night and in between does what he wants to do. ", "Bob Dylan"],
                    ["A person who never made a mistake never tried anything new.", "Albert Einstein"]
                ];


                // retrieving the index of quotes we've used before
                var usedQuoteIndexes = [];
                if (localStorage.usedQuoteIndexes) {
                    var usedQuoteIndexes = JSON.parse(localStorage.usedQuoteIndexes);
                }


                // getting an index that we haven't used before (that's not in the usedQuoteIndexes array);
                var rand = Math.floor(Math.random() * quotes.length);
                while (usedQuoteIndexes.indexOf(rand) !== -1) {
                    rand = Math.floor(Math.random() * quotes.length);
                }


                // adding that number to the array
                usedQuoteIndexes.push(rand);


                // once all quotes have been used once, then emptying the usedQuoteIndexes arary
                if (usedQuoteIndexes.length >= quotes.length) {
                    usedQuoteIndexes.length = 0;
                }


                // saving the usedQuoteIndexes array back into localStorage
                localStorage.usedQuoteIndexes = JSON.stringify(usedQuoteIndexes);



                var quote = quotes[rand][0];
                var author = quotes[rand][1];

                $element.append("<p>\"" + quotes[rand][0] + "\"</p>")
                        .append("<p style='font-style: italic;'> - " + author + "</p>")
                        .animate({opacity: 1}, 500);

            };

        });





