import React, { useGlobal, useState, useEffect } from "reactn";
import Card from "react-bootstrap/Card";
import { Line } from "react-chartjs-2";

const Charts = () => {
  const [emailData] = useGlobal("emailData");
  const [lineChartData, setLineChartData] = useState({});
  const [basicStats, setBasicStats] = useState({
    totalEmailsSent: 0, 
    totalOpens: 0, 
    totalLinkClicks: 0, 
    totalBounces: 0
  });

  useEffect(() => {
    if (Object.keys(emailData.length > 0) && emailData.appResults) {
      const lineChartLabels = emailData.appResults.map((em) => {
        return em.date;
      });
      const emailSendsByDay = emailData.appResults.map((em) => {
        return em.stats.map((s) => {
          return s.metrics.delivered;
        })[0];
      });

      const opensByDay = emailData.appResults.map((em) => {
        return em.stats.map((s) => {
          return s.metrics.opens;
        })[0];
      });

      const bouncesByDay = emailData.appResults.map((em) => {
        return em.stats.map((s) => {
          return s.metrics.bounces;
        })[0];
      });

      const linkClicksByDay = emailData.appResults.map((em) => {
        return em.stats.map((s) => {
          return s.metrics.clicks;
        })[0];
      });

      const totalEmailsSent = emailSendsByDay.reduce((a, b) => a + b, 0);
      const totalOpens = opensByDay.reduce((a, b) => a + b, 0);
      const totalBounces = bouncesByDay.reduce((a, b) => a + b, 0);
      const totalLinkClicks = linkClicksByDay.reduce((a, b) => a + b, 0);

      const lineChart = {
        labels: lineChartLabels,
        datasets: [
          {
            label: "Emails Sent Last 30 Days",
            fill: false,
            lineTension: 0.1,
            backgroundColor: "rgba(75,192,192,0.4)",
            borderColor: "rgba(75,192,192,1)",
            borderCapStyle: "butt",
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: "miter",
            pointBorderColor: "rgba(75,192,192,1)",
            pointBackgroundColor: "#fff",
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "rgba(75,192,192,1)",
            pointHoverBorderColor: "rgba(220,220,220,1)",
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            data: emailSendsByDay
          },
          {
            label: "Emails Opened Last 30 Days",
            fill: false,
            lineTension: 0.1,
            backgroundColor: "rgba(75,192,192,0.4)",
            borderColor: "#ffb400",
            borderCapStyle: "butt",
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: "miter",
            pointBorderColor: "#ffb400",
            pointBackgroundColor: "#fff",
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "#ffb400",
            pointHoverBorderColor: "rgba(220,220,220,1)",
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            data: opensByDay
          }
        ],
      };

      setLineChartData(lineChart);
      setBasicStats({ totalEmailsSent, totalOpens, totalLinkClicks, totalBounces });
    } else {
      setLineChartData({})
      setBasicStats({
        totalEmailsSent: 0, 
        totalOpens: 0, 
        totalLinkClicks: 0, 
        totalBounces: 0
      })
    }
  }, [emailData]);

  return (
    <div className="col-lg-12 col-md-12 col-sm-12 mb-4">
      <h5>Email Data</h5>
      <div>
        <div className="row">
          <div className="col-lg-6 col-sm-12">
            <Card>
              <Card.Body>
                {
                  Object.keys(lineChartData).length > 0 ?
                  <Line data={lineChartData} />
                  :
                  <div className="text-center">
                    <h6>No data to show yet</h6>
                  </div>
                }
                
              </Card.Body>
            </Card>
          </div>

          <div className="col-lg-6 col-sm-12">
            <Card>
              <Card.Body>
                <div className="row">
                  <div className="col-md-6 col-sm-6 col-lg-6 text-center">
                    <h6>Total Emails Sent</h6>
                    <h3>{basicStats.totalEmailsSent}</h3>
                  </div>
                  <div className="col-md-6 col-sm-6 col-lg-6 text-center">
                    <h6>Total Emails Opened</h6>
                    <h3>{basicStats.totalOpens}</h3>
                  </div>
                  <div className="col-md-6 col-sm-6 col-lg-6 text-center">
                    <h6>Total Link Clicks</h6>
                    <h3>{basicStats.totalLinkClicks}</h3>
                  </div>
                  <div className="col-md-6 col-sm-6 col-lg-6 text-center">
                    <h6>Total Bounces</h6>
                    <h3>{basicStats.totalBounces}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;
