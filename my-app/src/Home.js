import React from 'react';  
import Typewriter from './component/Typewriter';


class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: "Home",
      showIntro: false
    };
  }

  setShowIntro = (value) => {
    this.setState({ showIntro: value });
  }

  render() {
    const { selectedtax, company, handleEdit, handleEditCredit } = this.props;
    const { showIntro } = this.state;

    if (!company || !Array.isArray(company)) {
      return <p>Loading...</p>;
    }

    return (
      <div className='company mobwidth'>
        {company.length > 0 ? (
          company.map((com) => (
            <div className='tab-home' key={com.company_name}>
              <h2>
                <Typewriter text={com.company_name || ""} speed={1500 / ((com.company_name?.length || 1))} />
              </h2>
              <p>
                Address: {com.company_address || ""}  
              </p>
              <p>
                TRN:  {String(com.company_trn || "")}
              </p>
              <p>
                Amount:  {String(com.company_amount || "")} 
              </p>
              <p>
                Tax ID:  {`${selectedtax?.tax_name || ""} - ${selectedtax?.tax_percent || ""}%`}  
              </p>

              <button className="btn-edit" onClick={() => handleEdit(com)}>
                Edit
              </button>

              <button className="btn-edit" onClick={() => handleEditCredit()}>
                Create Report
              </button>
            </div>
          ))
        ) : (
          showIntro && <div className='modervideoss'></div>
        )}
      </div>
    );
  }
}

export default Home;
