 import { useState } from "react";
 import React from 'react';

 class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: "Home"
    };
  }

  render() {
    const { company, handleEdit } = this.props;

    if (!company || !Array.isArray(company)) {
      return <p>Loading...</p>;
    }

  

    return (
      <div className='company'>
       

        {company.map((com) => (
          <div className='tab-home' key={com.company_name}>
            <h2>{com.company_name}</h2>
            <p>Address: {com.company_address}</p>
            <p>TRN: {com.company_trn}</p>

            <button className="btn-edit" onClick={() => handleEdit(com)}>
              Edit
            </button>
          </div>
        ))}
      </div>
    );
  }
}

export default Home;
        