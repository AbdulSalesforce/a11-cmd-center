import { useParams, Link } from 'react-router-dom';
import standardsContent from '../data/standards-content.json';

export default function StandardDetail() {
  const { id } = useParams();
  const standard = standardsContent.standards[id];

  if (!standard) {
    return (
      <div className="slds-scope">
        <div className="slds-container_large slds-container_center slds-p-around_large">
          <div className="slds-text-heading_large slds-m-bottom_medium">
            Standard Not Found
          </div>
          <p className="slds-m-bottom_medium">
            The standard "{id}" could not be found.
          </p>
          <Link to="/standards" className="slds-button slds-button_neutral">
            ← Back to Standards
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="slds-scope">
      <div className="slds-container_large slds-container_center slds-p-around_large">
        {/* Back Button */}
        <div className="slds-m-bottom_medium">
          <Link to="/standards" className="slds-button slds-button_neutral">
            ← Back to Standards
          </Link>
        </div>

        {/* Page Header */}
        <div className="slds-page-header slds-m-bottom_large">
          <div className="slds-page-header__row">
            <div className="slds-page-header__col-title">
              <div className="slds-media">
                <div className="slds-media__body">
                  <div className="slds-page-header__name">
                    <div className="slds-page-header__name-title">
                      <h1>
                        <span className="slds-page-header__title slds-truncate" title={standard.title}>
                          {standard.title}
                        </span>
                      </h1>
                    </div>
                  </div>
                  <p className="slds-page-header__name-meta">WCAG 2.2 Success Criterion</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Standard Content */}
        <div className="slds-card">
          <div className="slds-card__body slds-card__body_inner slds-p-around_large">
            <div
              className="standard-content"
              style={{
                fontSize: '1rem',
                lineHeight: '1.6'
              }}
              dangerouslySetInnerHTML={{ __html: standard.html }}
            />
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="slds-m-top_large">
          <Link to="/standards" className="slds-button slds-button_neutral">
            ← Back to Standards
          </Link>
        </div>
      </div>
    </div>
  );
}
