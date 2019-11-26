import React, {Component} from 'react';
import style from './../styles/styles.less';

// https://www.investopedia.com/news/bitcoin-pizza-day-celebrating-20-million-pizza-order

// Blog Post: https://vallandingham.me/bubble_charts_with_d3v4.html
// Live Demo: http://vallandingham.me/bubble_chart_v4/#
// Source Code: https://github.com/vlandham/bubble_chart_v4

// https://d3js.org/
import * as d3 from 'd3';

// https://www.npmjs.com/package/moment
import * as moment from 'moment';

// http://recharts.org
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

class App extends Component {
  constructor() {
    super();

    this.state = {
      pizza_rendering:false
    }
  }
  componentDidMount() {
  }
  componentDidUpdate(prevProps, prevState, snapshot) {

  }
  componentWillUnMount() {

  }
  // shouldComponentUpdate(nextProps, nextState) {}
  // static getDerivedStateFromProps(props, state) {}
  // getSnapshotBeforeUpdate(prevProps, prevState) {}
  // static getDerivedStateFromError(error) {}
  // componentDidCatch() {}
  createPizzaChart() {
    if (this.state.pizza_rendering === false) {
      this.setState((state, props) => ({
        pizza_rendering:true
      }));
    }
    else {
      return false;
    }
    console.log('start')
    const animationDuration = 0;
    const intervalDuration = 10;
    const forceStrength = 0.025;
    const self = this;
    function bubbleChart() {
      // Constants for sizing
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Locations to move bubbles towards, depending
      // on which view mode is selected.
      const center = { x: (width / 2) - 30, y: (height / 2) - 30 };

      // These will be set in create_nodes and create_vis
      let bubbles = null;
      let nodes = [];
      // This is the container.
      const svg = d3.select('#' + style.vis)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

      // Here we create a force layout and
      // @v4 We create a force simulation now and
      //  add forces to it.
      const simulation = d3.forceSimulation()
        .velocityDecay(0.1)
        .force('x', d3.forceX().strength(forceStrength).x(center.x))
        .force('y', d3.forceY().strength(forceStrength).y(center.y))
        .force('charge', d3.forceManyBodyReuse().strength(charge))
        // .force('charge', d3.forceManyBody().strength(charge))
        .on('tick', ticked);

      // @v4 Force starts up automatically,
      //  which we don't want as there aren't any nodes yet.
      simulation.stop();

      /*
       * Callback function that is called after every tick of the
       * force simulation.
       * Here we do the acutal repositioning of the SVG circles
       * based on the current x and y values of their bound node data.
       * These x and y values are modified by the force simulation.
       */
      function ticked() {
        bubbles.attr('transform', (d) => {
          return 'translate(' + d.x + ',' + d.y + ')';
        });
      }

      // Charge function that is called for each node.
      // As part of the ManyBody force.
      // This is what creates the repulsion between nodes.
      //
      // Charge is proportional to the diameter of the
      // circle (which is stored in the radius attribute
      // of the circle's associated data.
      //
      // This is done to allow for accurate collision
      // detection with nodes of different sizes.
      //
      // Charge is negative because we want nodes to repel.
      // @v4 Before the charge was a stand-alone attribute
      //  of the force layout. Now we can use it as a separate force!
      function charge(d) {
        return -Math.pow(d.radius, 1.7) * forceStrength;
      }

      /*
       * This data manipulation function takes the raw data from
       * the CSV file and converts it into an array of node objects.
       * Each node will store data and visualization values to visualize
       * a bubble.
       *
       * rawData is expected to be an array of data objects, read in from
       * one of d3's loading functions like d3.csv.
       *
       * This function returns the new node array, with a node in that
       * array for each element in the rawData input.
       */
      // Sizes bubbles based on area.
      // @v4: new flattened scale names.
      let radiusScale = d3.scaleLog()
        .domain([2,1559])
        .range([120,20]);

      function createNodes(pizza_count, index) {

        // Remove nodes if extra.
        nodes = nodes.filter((d) => {
          return d.id < pizza_count
        });

        // Update remaining nodes.
        nodes = nodes.map((d) => {
          d.radius = radiusScale(pizza_count);
          return d;
        });

        // Add nodes in needed.
        for (let i = 0; i < pizza_count; i++) {
          if (!(nodes.find((node) => {return node.id === i}))) {
            nodes.push({
              id:i,
              radius: radiusScale(pizza_count),
              x: Math.random() * width,
              y: Math.random() * height
            });
          }
        }
        return nodes;
      };

      /*
       * Main entry point to the bubble chart. This function is returned
       * by the parent closure. It prepares the rawData for visualization
       * and adds an svg element to the provided selector and starts the
       * visualization creation process.
       *
       * selector is expected to be a DOM element or CSS selector that
       * points to the parent element of the bubble chart. Inside this
       * element, the code will add the SVG continer for the visualization.
       *
       * rawData is expected to be an array of data objects as provided by
       * a d3 loading function like d3.csv.
       */
      const chart = function chart(pizza_count) {
        // Convert raw data into nodes data.
        nodes = createNodes(pizza_count);

        // Bind nodes data to what will become DOM elements to represent them.
        bubbles = svg.selectAll('.bubblesE').data(nodes, (d) => { return d.id; });
        let bubblesE = bubbles.enter().append('svg:g').classed('bubblesE', true);

        // Remove unneeded circles.
        // http://bl.ocks.org/tgk/6068367
        // http://bl.ocks.org/alansmithy/e984477a741bc56db5a5
        // http://bl.ocks.org/sxywu/9358409
        bubbles.exit().remove();

        // Create new circle elements each with class `bubble`.
        // There will be one circle.bubble for each object in the nodes array.
        // Initially, their radius (r attribute) will be 0.
        // @v4 Selections are immutable, so lets capture the
        //  enter selection to apply our transtition to below.
        let circles = bubblesE.append('svg:circle')
          .classed('bubble', true)
          .attr('r', 0)
          .style('fill', 'transparent')
          .attr('stroke', 'transparent')
          .attr('stroke-width', 0);

        // https://bl.ocks.org/mbostock/950642
        // http://bl.ocks.org/eesur/be2abfb3155a38be4de4
        let images = bubblesE.append('svg:image')
          .attr('xlink:href', 'https://raw.githubusercontent.com/ebuddj/2019-bitcoin/master/public/img/pizza.png')
          .attr('x', (d) => { return -d.radius;})
          .attr('y', (d) => { return -d.radius;})
          .attr('height', (d) => { return d.radius * 2;})
          .attr('width', (d) => { return d.radius * 2;});

        // @v4 Merge the original empty selection and the enter selection
        bubbles = bubbles.merge(bubblesE);

        // Scale the circles.
        svg.selectAll('circle').transition()
          .duration(animationDuration)
          .attr('r', (d) => { radiusScale(pizza_count); });

        // Scale the images inside the circles.
        svg.selectAll('image').transition()
          .duration(animationDuration)
          .attr('y', (d) => { -radiusScale(pizza_count); })
          .attr('x', (d) => { -radiusScale(pizza_count); })
          .attr('height', (d) => { return radiusScale(pizza_count) * 2;})
          .attr('width', (d) => { return radiusScale(pizza_count) * 2;});

        // Set the simulation's nodes to our newly created nodes array.
        // @v4 Once we set the nodes, the simulation will start running automatically!
        simulation.nodes(nodes);
        simulation.alpha(1).restart();
      };
      
      // return the chart function from closure.
      return chart;
    }

    /*
     * Below is the initialization code as well as some helper functions
     * to create a new bubble chart instance, load the data, and display it.
     */
    let myBubbleChart = bubbleChart();

    /*
     * Function called once data is loaded from CSV.
     * Calls bubble chart function to display inside #vis div.
     */
    function display(error, data) {
      if (error) {
        // console.log(error)
      }
      let pizzas = data.price.map((d) => {
        return parseInt(((d[1]) / 25) * 2);
      });
      let dates = data.price.map((d) => {
        return d[0];
      });
      let i = 0;
      self.setState((state, props) => ({
        date:moment(dates[i]).format('YYYY-MM-DD'),
        pizza_count:'1BC = ' + pizzas[i] + ' pizzas'
      }));
      myBubbleChart(pizzas[i]);
      i++
      setTimeout(() => {
        let interval = setInterval(() => {
          self.setState((state, props) => ({
            date:moment(dates[i]).format('YYYY-MM-DD'),
            pizza_count:'1BC = ' + pizzas[i] + ' pizzas'
          }));
          myBubbleChart(pizzas[i]);
          i++
          if (!pizzas[i]) {
            clearInterval(interval)
          }
        }, intervalDuration);
      }, 5000);
    }

    // Load the data.
    d3.json('data/data_dollar_parity.json', display);
  }
  render() {
    return (
      <div className={style.app}>
        <div className={style.selection_container}>
          <p>You can choose either the pizza chart or line chart.</p>
          <button onClick={() => this.createPizzaChart()}>Pizza chart</button>
          <button onClick={() => this.createLineChart()}>Line chart</button>
        </div>
        <div className={style.date}>{this.state.date}</div>
        <div className={style.pizza_count}>
          <div className={style.value}>
            {this.state.pizza_count}
          </div>
        </div>
        <div id={style.vis}></div>
      </div>
    );
  }
}
export default App;