/* One enquiry form, shared by contextual links throughout the website. */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const profile = form.querySelector('#profile-select');
  const service = form.querySelector('#service-select');
  const budget = form.querySelector('#budget-select');
  const subject = form.querySelector('#contact-subject');
  const message = form.querySelector('#contact-message');
  const status = form.querySelector('#contact-status');
  const learning = ['private-ai-intensive', 'course-learning-question'];
  const engagements = ['guest-talks-keynotes', 'ai-workshops-training', 'custom-ai-program', 'panel-participation', 'hosted-event'];
  const commercial = [...engagements, 'private-ai-intensive', 'custom-content', 'brand-collaboration', 'advisory-collaboration', 'ai-consultancy'];
  const academic = ['research-position', 'academic-appointment', 'research-collaboration', 'institutional-collaboration'];
  const budgets = {
    individual: [['under-100', 'Under €100'], ['100-249', '€100–€249'], ['250-499', '€250–€499'], ['500-999', '€500–€999'], ['1000+', '€1,000+']],
    professional: [['under-1500', 'Under €1,500'], ['1500-2499', '€1,500–€2,499'], ['2500-4999', '€2,500–€4,999'], ['5000-9999', '€5,000–€9,999'], ['10000+', '€10,000+']]
  };
  let budgetGroup;

  const update = () => {
    const selected = service.value;
    const show = {
      learning: learning.includes(selected),
      engagement: engagements.includes(selected) || selected === 'private-ai-intensive',
      budget: commercial.includes(selected)
    };
    form.querySelectorAll('[data-contact-fields]').forEach(group => {
      const visible = Boolean(show[group.dataset.contactFields]);
      group.hidden = !visible;
      // Hidden details are omitted from submission; their values survive switching.
      group.disabled = !visible;
    });
    const nextBudgetGroup = profile.value === 'individual' ? 'individual' : 'professional';
    if (budgetGroup !== nextBudgetGroup) {
      budgetGroup = nextBudgetGroup;
      budget.replaceChildren(new Option('Select a range', ''));
      [...budgets[budgetGroup], ['not-decided', 'Not decided']].forEach(([value, label]) => budget.add(new Option(label, value)));
    }
    const label = service.selectedOptions[0]?.textContent;
    subject.value = selected ? `New website enquiry — ${label}` : 'New website enquiry';
    message.placeholder = learning.includes(selected)
      ? 'What would you like to learn, build or prepare for? Share your background and goals.'
      : engagements.includes(selected)
        ? 'Describe your audience, objectives, preferred topics and any practical requirements.'
        : academic.includes(selected)
          ? 'Describe the opportunity or collaboration, the expected role and relevant context or links.'
          : selected === 'cv-request'
            ? 'Let me know what you’d like to learn more about or why you’re requesting my CV.'
            : selected === 'ai-consultancy'
            ? 'Describe your AI challenge, current setup and the decisions you need help with.'
            : 'Tell me about your request, goals and any relevant context or links.';
  };

  const params = new URLSearchParams(window.location.search);
  const aliases = {
    'other-individual': 'other', 'other-organization': 'other', 'other-university': 'other', 'other-event': 'other',
    masterclass: 'ai-workshops-training', collaboration: 'brand-collaboration'
  };
  const requested = params.get('service');
  const requestedService = aliases[requested] || requested;
  const serviceExists = [...service.options].some(option => option.value && option.value === requestedService);
  const requestedProfile = params.get('profile');
  const profileExists = [...profile.options].some(option => option.value && option.value === requestedProfile);
  if (serviceExists) service.value = requestedService;
  if (profileExists) profile.value = requestedProfile;
  else if (serviceExists) {
    if (learning.includes(requestedService)) profile.value = 'individual';
    else if (academic.includes(requestedService)) profile.value = 'university';
    else if (engagements.includes(requestedService)) profile.value = 'organization';
  }
  if (serviceExists && requestedService === 'cv-request') {
    message.value = 'Hello Bruno, I’d like to request your CV, including further awards and certificates.';
  }
  // Treat query text as text only; never insert incoming values as HTML.
  if (serviceExists && learning.includes(requestedService)) {
    form.querySelector('#contact-course').value = (params.get('course') || '').slice(0, 200);
  }
  profile.addEventListener('change', update);
  service.addEventListener('change', update);
  form.addEventListener('reset', () => requestAnimationFrame(update));
  update();

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('button[type="submit"]');
    const label = button.querySelector('[data-submit-label]');
    button.disabled = true;
    label.textContent = 'Sending…';
    status.className = 'about-form-status';
    status.textContent = '';
    try {
      const response = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Submission failed');
      form.reset();
      update();
      status.classList.add('is-success');
      status.textContent = 'Thank you. Your enquiry has been sent. I will review it and get back to you.';
    } catch {
      status.classList.add('is-error');
      status.innerHTML = 'The form could not be sent. Please email <a href="mailto:brunomelicio.ai@gmail.com">brunomelicio.ai@gmail.com</a>.';
    } finally {
      button.disabled = false;
      label.textContent = 'Send enquiry';
    }
  });
});
