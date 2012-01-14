var page = 0, money = 10000;
var stocks = {
		'BEER': new stock('BEER', 20),
		'BLUE': new stock('BLUE', 20),
		'BUBL': new stock('BUBL', 20),
		'DRUG': new stock('DRUG', 20),
		'LOVE': new stock('LOVE', 20),
};
var turnEvent;

$(document).ready(function() {
	$('td.cash + td').html(money);
	
	var submitButton = null;
	$('#controls').submit(function(e) {
		if (submitButton == 'buy') {
			buy();
		}
		else if (submitButton == 'sell') {
			sell();
		}
		e.preventDefault();
	}).on('keyup mouseup', function(e) {
		submitButton = e.target.name;
	});
	
	$('#continue').submit(function(e) {
		page++;
		if (page == 3) {
			page = 'congrats';
		}
		else if (page == 'congrats') {
			return false; // TODO exit training
		}
		$.get('training_'+ page +'.html', function(data) {
			$('#content').html($(data).find('#content'));
		});
		e.preventDefault();
	});
	
	stocks['BEER'].buy(money / stocks['BEER'].value);
	drawAmounts();
});

// STOCKS ---------------------------------------------------------------------

function stock(name, value) {
	this.amount = 0;
	this.name = name;
	this.value = value;
	this.allvalues = [value];
	this.changeValue = function(newValue) {
		this.allValues.push(newValue);
		value = newValue;
	}
	this.buy = function(amount) {
		var cost = amount * this.value;
		if (cost <= money) {
			money -= cost;
			this.amount += amount;
			$('td.cash + td').html(money);
			drawAmounts();
			return true;
		}
		return Math.floor(money / this.value);
	}
	this.sell = function(amount) {
		if (amount <= this.amount) {
			this.amount -= amount;
			money += amount * this.value;
			$('td.cash + td').html(money);
			drawAmounts();
			return true;
		}
		return this.amount;
	}
}

function buy() {
	var values = validate();
	if (values) {
		stocks[values.name].buy(values.amount);
	}
}

function sell() {
	var values = validate();
	if (values) {
		stocks[values.name].sell(values.amount);
	}
}

function validate() {
	var val = parseInt($('#amount').val());
	if (val == NaN || val < 1) {
		alert('The number of shares of stock you want to trade must be a positive integer.');
		$('#amount').addClass('error');
		return false;
	}
	else {
		$('#amount').removeClass('error');
	}
	var name = $('#stock').val();
	if (!stocks[name]) {
		$('#stock').addClass('error');
		return false;
	}
	else {
		$('#stock').removeClass('error');
	}
	return {'name': name, 'amount': val};
}

function drawAmounts() {
	var $tbody = $('#stocks tbody');
	$tbody.empty();
	for (name in stocks) {
		$tbody.append('<tr><td class="stock">'+ name +'</td><td class="value">'+ stocks[name].value +'</td><td class="amount">'+ stocks[name].amount +'</td></tr>');
	}
	$tbody.append('<tr><td class="stock cash">Cash</td><td class="value">'+ money +'</td><td class="amount"></td></tr>');
}


// UTILITIES ------------------------------------------------------------------

function getRandBetween(lo, hi) {
	return parseInt(Math.floor(Math.random()*(hi-lo+1))+lo);
}

Array.prototype.remove = function(item) {
	var i = $.inArray(item, this);
	if (i === undefined || i < 0) return undefined;
	return this.splice(i, 1);
};

Array.prototype.getRandomElement = function() {
	var i = getRandBetween(0, this.length-1);
	return this[i];
}

Object.prototype.keys = function(){
	var keys = [];
	for (var key in this) {
		if (this.hasOwnProperty(key))
			keys.push(key);
	}
	return keys;
}


// POST-TRAINING --------------------------------------------------------------

function event(description, delta, note, stockName) {
	this.description = description;
	this.origStockName = stockName;
	this.stockName = function() {
		if (this.origStockName) {
			return this.origStockName;
		}
		return stocks.keys().getRandomElement();
	};
	this.deltaFunc = delta;
	this.delta = 0;
	this.getDelta = function() {
		this.delta = this.deltaFunc();
		return this.delta;
	};
	this.note = note;
}

function turn() {
	calculateNewPrices();
	turnEvent = eventTypes.getRandomElement();
	$('.info').html(turnEvent.description());
	drawAmounts();
}

function calculateNewPrices() {
	for (stock in stocks) {
		var stockValue = stocks[stock].value;
		if (turnEvent && stock == turnEvent.stockName()) {
			stocks[stock].changeValue(stockValue + turnEvent.getDelta());	
		}
		else {
			stocks[stock].changeValue(stockValue + getRandBetween(-.1*stockValue, .1*stockValue));
		}
	}
}

var eventTypes = [
                  new event(function() {
                	  return this.stockName() + ' is releasing their quarterly earnings report tomorrow. Wall street analysts think they will hit their predictions, but you can never be sure.';
                  }, function() {
                	  var stockPercent = stocks[this.stockName()].value * 0.1;
                	  return getRandBetween(-stockPercent*.5, stockPercent*1.5);
                  }, function() {
					  if (this.delta < 0) {
						  return this.stockName() + ' missed their earnings predictions. Stock price fell by ' + this.delta + '%.';
					  }
					  else if (this.delta > 0) {
						  return this.stockName() + ' exceeded their earnings predictions. Stock price rose by ' + this.delta + '%.';
					  }
					  else {
						  return this.stockName() + ' exactly hit their earnings predictions. Stock price remained the same.';
					  }
				  }, null),
                 new event(function() {
                	  return this.stockName() + ' is holding a surprise press release tomorrow. The news could be good or bad.';
                  }, function() {
                	  var stockPercent = stocks[this.stockName()].value * 0.15;
                	  return getRandBetween(-stockPercent, stockPercent);
                  }, function() {
					  if (this.delta < 0) {
						  return 'One of ' + this.stockName + '\'s key executives must resign due to health reasons. Stock price fell by ' + this.delta + '%.';
					  }
					  else if (this.delta > 0) {
						  return this.stockName() + ' unveiled a new product for a rapidly growing market. Stock price rose by ' + this.delta + '%.';
					  }
					  else {
						  return this.stockName() + ' announced they will sponsor PennApps in the fall of 2012. Wall Street is unsure how it will play out. Stock price remained the same.';
					  }
				  }, null),
				  new event(function() {
                	  return this.stockName() + '\'s largest competitor just went bankrupt. Generally, analysts see situations like this as an opportunity to gain market share. However, it may also be seen as a sign of a weak or struggling industry.';
                  }, function() {
                	  var stockPercent = stocks[this.stockName()].value * 0.1;
                	  return getRandBetween(-stockPercent, stockPercent*1.5);
                  }, function() {
					  if (this.delta < 0) {
						  return 'A large number of analysts think ' + this.stockName + 'may be the next to file for Chapter 11. Stock price fell by ' + this.delta + '%.';
					  }
					  else if (this.delta > 0) {
						  return 'A large number of analysts think ' + this.stockName() + ' is strategically poised to capture market share from its bankrupt competitor. Stock price rose by ' + this.delta + '%.';
					  }
					  else {
						  return 'Analysts\'s opinions were split evenly on the news. ' + this.stockName + '\'s stock price remained the same.';
					  }
				  }, null),
				  new event(function() {
                	  return 'Rumors have spread that ' + this.stockName + '\'s CFO cooked the books. If these allegations prove true, they could be devastating.';
                  }, function() {
                	  var stockPercent = stocks[this.stockName()].value * 0.1;
                	  return getRandBetween(-stockPercent*2.5, stockPercent);
                  }, function() {
					  if (this.delta < 0) {
						  return this.stockName + '\'s CFO was indicted by the SEC. Stock price fell by ' + this.delta + '%.';
					  }
					  else if (this.delta > 0) {
						  return 'The rumors turned out to be false. ' + this.stockName() + '\'s stock price rose by ' + this.delta + '%.';
					  }
					  else {
						  return 'The issue was dwarfed by an even larger scandal at Halliburton. ' + this.stockName + '\'s stock price remained the same.';
					  }
				  }, null),
				  new event(function() {
                	  return 'China\'s political leaders are meeting to determine monetary policy. ' + this.stockName + ' buys key supplies from China. If the Yuan strengethens, ' + this.stockName + ' will have to pay more to manufacture its products.';
                  }, function() {
                	  var stockPercent = stocks[this.stockName()].value * 0.1;
                	  return getRandBetween(-stockPercent*2, stockPercent);
                  }, function() {
					  if (this.delta < 0) {
						  return 'Due to U.S. pressure, China allowed its currency to partially elevate. ' + this.stockName + '\'s stock price fell by ' + this.delta + '%.';
					  }
					  else if (this.delta > 0) {
						  return 'The Chinese government kept the Yuan pegged to the dollar. In response, ' + this.stockName() + '\'s stock price rose by ' + this.delta + '%.';
					  }
					  else {
						  return 'The Chinese government maintained the current exchange rate, but indicated they\'d be willing to change it in the future. ' + this.stockName + '\'s stock price remained the same.';
					  }
				  }, null),
];
