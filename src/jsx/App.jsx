import React, {Component} from 'react';
import style from './../styles/styles.less';

// https://www.investopedia.com/news/bitcoin-pizza-day-celebrating-20-million-pizza-order

// Blog Post:https://vallandingham.me/bubble_charts_with_d3v4.html
// Live Demo:http://vallandingham.me/bubble_chart_v4/#
// Source Code:https://github.com/vlandham/bubble_chart_v4

// https://d3js.org/
import * as d3 from 'd3';

// https://www.npmjs.com/package/moment
import * as moment from 'moment';

// https://www.chartjs.org/
import Chart from 'chart.js';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      line_chart_rendered:false,
      line_chart_rendered_16_9:false,
      pizza_chart_rendered:false,
      line_chart_show_meta:false,
      value:0
    };

    // We need a ref for chart.js.
    this.lineChartRef = React.createRef();
  }
  componentDidMount() {
    // Uncomment to run automatically either one.
    // setTimeout(() => {
      // this.createLineChart(16/9);
    // }, 5000);
    // this.createLineChart(1);
    // this.createPizzaChart();
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
    // Check if chart has been rendered and fail if it is.
    if (this.state.pizza_chart_rendered === false) {
      this.setState((state, props) => ({
        pizza_chart_rendered:true
      }));
    }
    else {
      return false;
    }

    // Define constants.
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
      const center = { x:(width / 2) - 30, y:(height / 2) - 30 };

      // These will be set in create_nodes and create_vis
      let bubbles = null;
      let nodes = [];
      // This is the container.
      const svg = d3.select('#' + style.pizza_chart)
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
      // @v4:new flattened scale names.
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
              radius:radiusScale(pizza_count),
              x:Math.random() * width,
              y:Math.random() * height
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
        return false;
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
    d3.json('./data/data_dollar_parity.json', display);
  }
  createLineChart(ratio) {
    // Check if chart has been rendered and fail if it is.
    if (this.state.line_chart_rendered === false) {
      this.setState((state, props) => ({
        line_chart_rendered:true
      }));
    }
    else {
    }

    // Define constants.
    const self = this;
    let line_chart = false;
    function display(error, data) {
      if (error) {
        // console.log(error)
        return false;
      }

      data.price = data.price.map((values) => {
        return {
          timestamp:values[0],
          value:values[1]
        }
      });

      // Define options.
      let options = {
        data:{
          datasets:[{
            backgroundColor:'rgba(247, 147, 26, 0.7)',
            borderColor:'#f7931a',
            borderWidth:2,
            data:[0],
            fill:true,
            label:'Bitcoin value',
            radius:0
          }],
          labels:[moment(1279238400000).format('YYYY-MM-DD')]
        },
        options:{
          hover:{
            enabled:false,
          },
          legend:{
            display:false
          },
          title:{
            display:false,
            text:''
          },
          tooltips:{
            enabled:false,
          },
          aspectRatio:ratio,
          responsive:true,
          scales:{
            xAxes:[{
              display:true,
              scaleLabel:{
                display:false,
                labelString:'day'
              }
            }],
            yAxes:[{
              display:true,
              scaleLabel:{
                display:true,
                labelString:'Bitcoin value in dollars'
              }
            }]
          }
        },
        type:'line'
      };

      function updateChart() {
        // Update chart.
        let interval = setInterval(() => {
          let price = data.price.shift();
          self.setState((state, props) => ({
            timestamp:price.timestamp,
            value:price.value
          }));
          options.data.labels.push(moment(price.timestamp).format('YYYY-MM-DD'));
          options.data.datasets[0].data.push(price.value);
          line_chart.update();

          if (data.price.length < 1) {
            clearInterval(interval);
            setTimeout(() => {
              line_chart.destroy();
              if (self.state.line_chart_rendered_16_9 === false) {
                // self.setState((state, props) => ({
                //   line_chart_rendered_16_9:true,
                //   line_chart_show_meta:false
                // }), () => self.createLineChart(1));
              }
              else {
                self.setState((state, props) => ({
                  line_chart_show_meta:false
                }));
              }
            }, 5000);
          }
        }, 30);
      }

      // Get context from ref.
      let ctx = self.lineChartRef.current.getContext('2d');
      if (self.state.line_chart_rendered_16_9 === true) {
        // setTimeout(() => {
        //   line_chart = new Chart(ctx, options);
        //   line_chart.canvas.parentNode.style.height = (window.innerHeight - 20) + 'px';
        //   line_chart.canvas.parentNode.style.width = (window.innerHeight - 20) + 'px';
        //   self.setState((state, props) => ({
        //     line_chart_show_meta:true
        //   }));
        //   updateChart();
        // }, 5000);
      }
      else {
        line_chart = new Chart(ctx, options);
        // Print events (hidden with css).
        let events = [];
        data.events.forEach(data => {
          events.push(<div key={data.x}>{moment(data.x).format('YYYY-MM-DD')} {data.text}</div>);
        });
        self.setState((state, props) => ({
          events:events,
          line_chart_show_meta:true
        }));
        updateChart();
      }
    }
    // Load the data.
    d3.json('./data/data.json', display);
  }
  render() {
    return (
      <div className={style.app}>
        <div className={style.selection_container} style={(this.state.pizza_chart_rendered === true || this.state.line_chart_rendered === true) ? {display:'none'} : {display:'block'}}>
          <p>You can choose either the pizza chart or line chart.</p>
          <button onClick={() => this.createPizzaChart()}>Pizza chart</button>
          <button onClick={() => this.createLineChart(16/9)}>Line chart 16:9</button>
          <button onClick={() => this.createLineChart(1)}>Line chart 1:1</button>
        </div>
        <div className={style.date}>{this.state.date}</div>
        <div className={style.pizza_count}>
          <div className={style.value}>
            {this.state.pizza_count}
          </div>
        </div>
        <div id={style.pizza_chart} style={(this.state.pizza_chart_rendered === true) ? {display:'block'} : {display:'none'}}></div>
        <div style={(this.state.line_chart_rendered === true) ? {display:'block'} : {display:'none'}}>
          <div style={{position:'relative', margin:'auto auto'}}>
            <div className={style.line_chart_meta} style={(this.state.line_chart_show_meta === true) ? {display:'block'} : {display:'none'}}>
              <div>{moment(this.state.timestamp).format('MMMM YYYY')}</div>
              <div>${this.state.value.toFixed(2)}</div>
            </div>
            <canvas id={style.line_chart} ref={this.lineChartRef}></canvas>
          </div>
          <div className={style.events}>{this.state.events}</div>
        </div>
      </div>
    );
  }
}
export default App;